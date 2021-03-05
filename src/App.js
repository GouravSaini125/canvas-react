import React, {useEffect, useState} from 'react';
import './App.css'
import Canvas from "./components/Canvas";
import Button from "./components/Button";
import Directions from "./configs/Directions";

import audio from "./assets/waves.wav";
import * as axios from "axios";

function App() {

    const [direction, setDirection] = useState(null);
    const [pendingTimeout, setPendingTimeout] = useState(null);
    const [stream, setStream] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        const strm = document.querySelector("canvas").captureStream();
        setStream(strm);

        return () => {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
    }, []);

    const startCapture = mediaRecorder => {
        let recordedChunks = [];

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStreamStop;
        mediaRecorder.start();

        function handleDataAvailable(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        }

        async function handleStreamStop() {
            setIsConverting(true);
            const blob = new Blob(recordedChunks, {
                type: "video/webm"
            });

            console.log(blob)
            const formData = new FormData();
            formData.append('file', blob);
            await axios.post("/api", formData)
                .then(res => {
                    console.log(res.data);
                })
                .catch(err => {
                    console.log(err)
                })

            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setIsConverting(false);
        }
    }

    const setDirectionWithTimeout = dir => {
        clearTimeout(pendingTimeout);
        setDirection(dir);
        setVideoUrl(null);

        // const options = {mimeType: 'video/webm;codecs=h264'};
        var options = {
            // audioBitsPerSecond : 128000,
            videoBitsPerSecond: 64000000,
            mimeType: 'video/webm;codecs=h264'
        }
        const aud = new Audio(audio);
        aud.loop = true;
        aud.crossOrigin = 'anonymous';
        aud.play();

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const stream_dest = ctx.createMediaStreamDestination();
        const source = ctx.createMediaElementSource(aud);
        source.connect(stream_dest);

        const str = stream_dest.stream;

        str.getTracks().forEach(track => {
            stream.addTrack(track);
        });
        const mediaRecorder = new MediaRecorder(stream, options);

        startCapture(mediaRecorder);

        const to = setTimeout(function () {
            mediaRecorder.stop();
            setDirection(null);
            aud.pause();
        }, 5000);
        setPendingTimeout(to);
    }

    const handleVideoDownload = () => {
        let link = document.createElement("a");
        link.download = "capture.mp4";
        link.href = videoUrl;
        link.click();
    }

    return (
        <section>

            <Canvas direction={direction}/>

            <div className="controls">

                <Button
                    direction={Directions.DIRECTION_UP}
                    isDisabled={direction === Directions.DIRECTION_UP || isConverting}
                    setDirectionWithTimeout={setDirectionWithTimeout}
                />

                <div className="row">
                    <Button
                        direction={Directions.DIRECTION_LEFT}
                        isDisabled={direction === Directions.DIRECTION_LEFT || isConverting}
                        setDirectionWithTimeout={setDirectionWithTimeout}
                    />

                    <button
                        onClick={handleVideoDownload}
                        disabled={videoUrl === null}
                        className="download-btn"
                    >
                        {
                            isConverting ? (
                                <div className="loader-wrapper">
                                    <div className="spinning-loader"/>
                                </div>
                            ) : "DOWNLOAD"
                        }
                    </button>

                    <Button
                        direction={Directions.DIRECTION_RIGHT}
                        isDisabled={direction === Directions.DIRECTION_RIGHT || isConverting}
                        setDirectionWithTimeout={setDirectionWithTimeout}
                    />
                </div>

                <Button
                    direction={Directions.DIRECTION_DOWN}
                    isDisabled={direction === Directions.DIRECTION_DOWN || isConverting}
                    setDirectionWithTimeout={setDirectionWithTimeout}
                />

            </div>

        </section>
    );
}

export default App;