import "@mantine/core/styles.css";
import "./index.css";

import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route } from "react-router-dom";

import { App } from "./components/App/App";
import { Home } from "./components/Home/Home";
import { Privacy, Terms, FAQ } from "./components/Pages/Pages";
import { TopBar } from "./components/TopBar/TopBar";
import { Footer } from "./components/Footer/Footer";
import firebase from "firebase/compat/app";
import "firebase/auth";
import { serverPath } from "./utils/utils";
import { Create } from "./components/Create/Create";
import { Discord } from "./components/Discord/Discord";
import config from "./config";
import { DEFAULT_STATE, MetadataContext } from "./MetadataContext";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  primaryColor: "verde",
  primaryShade: 5,
  autoContrast: true,
  white: "#f2eee6",
  black: "#020201",
  colors: {
    dark: [
      "#f2eee6", // [0] primary text
      "#b5b0a8", // [1] secondary text
      "#9c988e", // [2] muted text
      "#4a4540", // [3] subtle dividers
      "#2e2a24", // [4] card border
      "#221e18", // [5] separator
      "#181410", // [6] tertiary background
      "#110f0c", // [7] card background
      "#0c0a07", // [8] secondary background
      "#020201", // [9] primary background
    ],
    verde: [
      "#e6fff2",
      "#b3ffd6",
      "#80ffb9",
      "#4dff9d",
      "#1aff80",
      "#00ff6a", // [5] brand primary
      "#00cc55",
      "#009940",
      "#006b30", // [8] light-theme green
      "#003318",
    ],
    amarelo: [
      "#fffde0",
      "#fff8b3",
      "#fff380",
      "#ffee4d",
      "#ffea68", // [4] brand yellow
      "#ffe01a",
      "#cbb300",
      "#8a6a00", // [7] light-theme yellow
      "#5c4700",
      "#2e2400",
    ],
  },
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "IBM Plex Mono, monospace",
  headings: {
    fontFamily: "Bebas Neue, sans-serif",
    fontWeight: "400",
  },
  defaultRadius: "xs",
  radius: {
    xs: "3px",
    sm: "5px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
});

const Debug = lazy(() => import("./components/Debug/Debug"));

const firebaseConfig = config.VITE_FIREBASE_CONFIG;
if (firebaseConfig) {
  firebase.initializeApp(JSON.parse(firebaseConfig));
}

// Redirect old-style URLs
if (window.location.hash && window.location.pathname === "/") {
  const hashRoomId = window.location.hash.substring(1);
  window.location.href = "/watch/" + hashRoomId;
}

class WatchParty extends React.Component {
  public state = DEFAULT_STATE;
  async componentDidMount() {
    if (firebaseConfig) {
      firebase.auth().onAuthStateChanged(async (user: firebase.User | null) => {
        if (user) {
          // console.log(user);
          this.setState({ user });
          const token = await user.getIdToken();
          const response = await window.fetch(
            serverPath + `/metadata?uid=${user.uid}&token=${token}`,
          );
          const data = await response.json();
          this.setState({
            isSubscriber: data.isSubscriber,
            streamPath: data.streamPath,
            convertPath: data.convertPath,
            beta: data.beta,
          });
        }
      });
    } else {
      // Firebase isn't set up so enable subscriber features
      this.setState({
        isSubscriber: true,
      });
    }
  }
  render() {
    return (
      // <React.StrictMode>
      <MantineProvider theme={theme} forceColorScheme="dark">
        <MetadataContext.Provider value={this.state}>
          <BrowserRouter>
            <Route
              path="/"
              exact
              render={(props) => {
                return (
                  <React.Fragment>
                    <TopBar hideNewRoom />
                    <Home />
                    <Footer />
                  </React.Fragment>
                );
              }}
            />
            <Route
              path="/create"
              exact
              render={() => {
                return <Create />;
              }}
            />
            <Route
              path="/watch/:roomId"
              exact
              render={(props) => {
                return <App urlRoomId={props.match.params.roomId} />;
              }}
            />
            <Route
              path="/r/:vanity"
              exact
              render={(props) => {
                return <App vanity={props.match.params.vanity} />;
              }}
            />
            <Route path="/terms">
              <TopBar />
              <Terms />
              <Footer />
            </Route>
            <Route path="/privacy">
              <TopBar />
              <Privacy />
              <Footer />
            </Route>
            <Route path="/faq">
              <TopBar />
              <FAQ />
              <Footer />
            </Route>
            <Route path="/discord/auth" exact>
              <Discord />
            </Route>
            <Route path="/debug">
              <TopBar />
              <Suspense fallback={null}>
                <Debug />
              </Suspense>
              <Footer />
            </Route>
          </BrowserRouter>
        </MetadataContext.Provider>
      </MantineProvider>
      // </React.StrictMode>
    );
  }
}
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<WatchParty />);
