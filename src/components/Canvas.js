import React, {useEffect, useRef} from 'react';
import image from '../assets/image.jpeg';
import '../App.css'
import Directions from "../configs/Directions";

function Canvas(props) {

    const {direction} = props;
    const canvasRef = useRef(null);

    const getImageOffset = () => {
        const hRate = 200 / (60 * 5);
        const vRate = 150 / (60 * 5);
        switch (direction) {
            case Directions.DIRECTION_UP:
                return {
                    x: 0,
                    y: -vRate,
                };
            case Directions.DIRECTION_DOWN:
                return {
                    x: 0,
                    y: vRate,
                };
            case Directions.DIRECTION_LEFT:
                return {
                    x: -hRate,
                    y: 0,
                };
            case Directions.DIRECTION_RIGHT:
                return {
                    x: hRate,
                    y: 0,
                };
            default:
                return {
                    x: 0,
                    y: 0,
                };
        }
    }

    const draw = (ctx, img, currentPosition) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(img, currentPosition.x, currentPosition.y, img.width / 10, img.height / 10);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.canvas.height = 480;
        context.canvas.width = 640;

        let animationFrameId;

        const img = new Image();
        img.src = image;
        img.onload = function () {

            const imgHeight = img.height / 10;
            const imgWidth = img.width / 10;
            const imageXOffset = context.canvas.width / 2 - imgWidth / 2;
            const imageYOffset = context.canvas.height / 2 - imgHeight / 2;
            const previousPosition = {
                x: imageXOffset,
                y: imageYOffset,
            }
            draw(context, img, previousPosition)
            const render = () => {

                const offset = getImageOffset();
                const currentPosition = {
                    x: previousPosition.x + offset.x,
                    y: previousPosition.y + offset.y,
                }

                if (currentPosition.x !== previousPosition.x || currentPosition.y !== previousPosition.y) {
                    draw(context, img, currentPosition);
                    previousPosition.x = currentPosition.x;
                    previousPosition.y = currentPosition.y;
                }

                animationFrameId = window.requestAnimationFrame(render);
            }
            render();
        }

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        }
    }, [direction]);

    return <canvas ref={canvasRef}/>;
}

export default Canvas;