import twitterLogo from "./assets/twitter-logo.svg"
import "./App.css"
import { useEffect, useState } from "react"

// Constants
const TWITTER_HANDLE = "ricardomlima89"
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const TEST_GIFS = [
  "https://media.giphy.com/media/l3V0ma60jQqGCoJyM/giphy.gif",
  "https://media.giphy.com/media/PApUlVfEFmZAQ/giphy.gif",
  "https://media.giphy.com/media/ToMjGpocv0a1U7zbXQ4/giphy.gif",
  "https://media.giphy.com/media/13ea4eXuOuQsmY/giphy.gif",
];

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

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log("Gif link:", inputValue);
      setGifList([...gifList, inputValue]);
      setInputValue("");
    } else {
      console.log("Empty input. Try again.");
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

  const renderConnectedContainer = () => (
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
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  )

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
      setGifList(TEST_GIFS);
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
