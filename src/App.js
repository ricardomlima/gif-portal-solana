import { useEffect, useState } from "react"
import twitterLogo from "./assets/twitter-logo.svg"
import "./App.css"
import idl from './idl.json';
import kp from './keypair.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, web3, AnchorProvider } from '@project-serum/anchor';


// Constants
const TWITTER_HANDLE = "ricardomlima89"
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

// SystemProgram is a reference to Solana's runtime
const { SystemProgram } = web3;

// Creates a key pair for the account that'll store the gif data
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// returns our program id from the IDL
const programID = new PublicKey(idl.metadata.address);

// defines connection to devnet
const network = clusterApiUrl('devnet');

// controls how we want to know when a transaction is complete
const opts = {
  preflightCommitment: "processed"
}


const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);
  /*
   * This function defines if the wallet is connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          /*
           * The solana object gives us a function that allows us to connect
           * directly with the users wallet
           */
          const response = await solana.connect({ onlyIfTrusted: true })
          console.log(
            "Connect with public key: !",
            response.publicKey.toString()
          );

          /*
           * Users public key stored in state to be used later
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        console.log("Solana object not found!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log(
        "Conectado com a Chave Pública: ",
        response.publicKey.toString()
      );
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const sendGif = async () => {

    if(inputValue.length === 0){
      console.log("No gif link was given!");
      return
    }
    setInputValue("");
    console.log("Gif link:", inputValue);

    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Gif successfully sent to the program", inputValue);
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF: ", error);
    }

  }

  /*
   * Show this when user is not connected yet
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >Conecte sua carteira</button>
  )

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Initialize programs unique account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter your gif link here!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Send
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((gif) => (
              <div className="gif-item" key={gif}>
                <img src={gif.gifLink} alt={gif.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Account obtained", account);
      setGifList(account.gifList)
    } catch (error) {
      console.log("Error retrieving gif list:", error)
      setGifList(null);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping');
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      })
      console.log("Base account created with the address :", baseAccount.publicKey.toString())
      await getGifList();
    } catch (error) {
      console.log("Error creating a new base account: ", error);
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    /*
     * Solana team suggests that we should wait for the window to load completely
     * before checking if wallet exists
     */
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad)
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Obtaining GIF list...");

      // Define the state
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF da Galera 🖼</p>
          <p className="sub-text">Veja sua coleção de GIF no metaverso ✨</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`feito com ❤️ por @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App
