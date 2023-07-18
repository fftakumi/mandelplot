import { useEffect, useRef, useState, useCallback } from "react"

const useAnimationFrame = (isRunning, callback = () => { }) => {
    const reqIdRef = useRef();
    const loop = useCallback(() => {
        if (isRunning) {
            // isRunning が true の時だけループ
            reqIdRef.current = requestAnimationFrame(loop);
            callback();
        }
        // isRunning も依存配列に追加
    }, [isRunning, callback]);

    useEffect(() => {
        reqIdRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(reqIdRef.current);
    }, [loop]);
};

const Mantelbrot = (props) => {
    const canvasRef = useRef(null);

    const [shouldUpdate, setShouldUpdate] = useState(false)
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    const [maxIterations, setMaxIterations] = useState(100);
    let zoom = 200;
    let offsetX = 0;
    let offsetY = 0;

    let isDrag = false;
    let dragStartX = 0;
    let dragStartY = 0;

    let animationIds = null;

    const onWheel = (event) => {
        zoom += event.deltaY * zoom / 1000
    }

    const onResize = () => {
        setWidth(document.documentElement.clientWidth);
        setHeight(document.documentElement.clientHeight);
    }

    const onMousedown = (event) => {
        isDrag = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
    }

    const onMousemove = (event) => {
        if (isDrag) {
            offsetX += (dragStartX - event.clientX) / zoom / 2
            offsetY += (dragStartY - event.clientY) / zoom / 2
        }
    }

    const onMouseup = (event) => {
        isDrag = false;
        offsetX += (dragStartX - event.clientX) / zoom / 2
        offsetY += (dragStartY - event.clientY) / zoom / 2
    }

    const sloppyPlot = () => {
        const ctx = canvasRef.current.getContext("2d")
        let maxSloppiness = 8
        const sloppinesses = [...Array(Math.log2(maxSloppiness)+1)].map((_, i) => Math.pow(2, i)).reverse()
        for (let i = 0; i < sloppinesses.length; i++) {
            const squareSize = sloppinesses[i];
            for (let x = 0; x < width; x = x + squareSize) {
                for (let y = 0; y < height; y = y + squareSize) {
                    if (squareSize != maxSloppiness && ((x / squareSize) % 2)== 0 && ((y / squareSize) % 2 )== 0) {
                        continue;
                    }

                    if (squareSize != maxSloppiness && isDrag) {
                        continue;
                    }

                    // ピクセル座標をマンデルブロ集合の複素数平面上の座標に変換
                    const a = (x - width / 2) / zoom + offsetX;
                    const b = (y - height / 2) / zoom + offsetY;
    
                    // マンデルブロ集合の計算
                    let ca = 0;
                    let cb = 0;
                    let n = 0;
    
                    while (n < maxIterations) {
                        const aa = ca * ca;
                        const bb = cb * cb;
                        const twoab = 2 * ca * cb;
    
                        ca = aa - bb + a;
                        cb = twoab + b;
    
                        // 収束判定
                        if (aa + bb > 4) {
                            break;
                        }
    
                        n++;
                    }
    
                    // 色の設定
                    const hue = (n / maxIterations) * 360;
                    const saturation = 100;
                    const lightness = n < maxIterations ? 50 : 0;
                    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
                    // ピクセルの描画
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
            if (isDrag) {
                return;
            }
        }

    }

    const plot = () => {
        const ctx = canvasRef.current.getContext("2d")
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                // ピクセル座標をマンデルブロ集合の複素数平面上の座標に変換
                const a = (x - width / 2) / zoom + offsetX;
                const b = (y - height / 2) / zoom + offsetY;

                // マンデルブロ集合の計算
                let ca = 0;
                let cb = 0;
                let n = 0;

                while (n < maxIterations) {
                    const aa = ca * ca;
                    const bb = cb * cb;
                    const twoab = 2 * ca * cb;

                    ca = aa - bb + a;
                    cb = twoab + b;

                    // 収束判定
                    if (aa + bb > 4) {
                        break;
                    }

                    n++;
                }

                // 色の設定
                const hue = (n / maxIterations) * 360;
                const saturation = 100;
                const lightness = n < maxIterations ? 50 : 0;
                const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                // ピクセルの描画
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    const renderCanvas = () => {
        requestAnimationFrame(renderCanvas)
        sloppyPlot()
    }

    useAnimationFrame(shouldUpdate, sloppyPlot);

    useEffect(() => {
        window.addEventListener("resize", onResize);
        setWidth(document.documentElement.clientWidth);
        setHeight(document.documentElement.clientHeight);
        animationIds = requestAnimationFrame(renderCanvas)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    useEffect(() => {
        setShouldUpdate(false)
        setShouldUpdate(true)
    }, [zoom, width, height])

    return (
        <div>
            <canvas width={width}
                height={height}
                ref={canvasRef}
                onWheel={onWheel}
                onMouseDown={onMousedown}
                onMouseUp={onMouseup}
                onMouseMove={onMousemove}>
            </canvas>
        </div>
    )
}

export default Mantelbrot