const readline = require("readline");
const { Web3 } = require("web3");
const myCoinContractJson = require("./contracts/MyCoin.json");

const GAS_LIMIT = 500000;

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function readWithPrompt(prompt) {
  return new Promise((resolve) => {
    readlineInterface.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

const web3 = new Web3("http://127.0.0.1:9545/");

async function getMyCoinContract() {
  const myCoinContractAddress =
    myCoinContractJson.networks[await web3.eth.net.getId()].address;

  const myCoinContract = new web3.eth.Contract(
    myCoinContractJson.abi,
    myCoinContractAddress
  );

  return myCoinContract;
}

function printHelp() {
  console.log(`Available commands:

help - print this help
balance - print your balance
transfer <address> <amount> - transfer coins to <address>\n`);
}

async function sendSignedMethodCallTransaction(
  methodCallABI,
  contract,
  account
) {
  const transaction = {
    from: account.address,
    to: contract.options.address,
    gas: GAS_LIMIT,
    data: methodCallABI,
    gasPrice: await web3.eth.getGasPrice(),
  };

  const signedTransaction = await account.signTransaction(transaction);

  return await web3.eth.sendSignedTransaction(
    signedTransaction.rawTransaction,
    account.privateKey
  );
}

async function processCommand(command, account, myCoinContract) {
  const separatedCommand = command.split(" ");
  const commandName = separatedCommand[0];
  const commandArguments = separatedCommand.slice(1);

  try {
    switch (commandName) {
      case "help":
        printHelp();
        break;
      case "balance":
        console.log(`${await myCoinContract.methods
          .getBalance()
          .call({ from: account.address })} coins
            `);
        break;
      case "transfer":
        if (commandArguments.length < 2) {
          console.log("Invalid arguments");
          break;
        }

        const hadEnoughOnBalance = await sendSignedMethodCallTransaction(
          myCoinContract.methods
            .transfer(commandArguments[0], BigInt(commandArguments[1]) || 0)
            .encodeABI(),
          myCoinContract,
          account
        );

        if (!hadEnoughOnBalance) {
          console.log("Not enough coins on your balance!");
        }
        break;
      default:
        console.log(`Unknown command: ${commandName}\n`);
        printHelp();
        break;
    }
  } catch (e) {
    console.log("Failed to execute the command!");
    console.log(e);
  }
}

async function main() {
  const privateKey = await readWithPrompt("Your private key: ");

  const account = web3.eth.accounts.privateKeyToAccount("0x" + privateKey);

  console.log("Welcome to the My Coin interface!\n");
  printHelp();

  const myCoinContract = await getMyCoinContract();

  while (true) {
    const command = await readWithPrompt("~> ");

    await processCommand(command, account, myCoinContract);
  }
}

main();
