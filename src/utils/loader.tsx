import { useState, useEffect } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import LoaderJson from "../assets/loader.json";

const Loader = () => {
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <Player
                autoplay
                loop
                src={LoaderJson}
                style={{ height: "150px", width: "150px" }}
            />
        </div>
    );
};

export default Loader;