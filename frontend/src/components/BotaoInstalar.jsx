import { useEffect, useState } from "react";

export default function BotaoInstalar() {

    const [prompt, setPrompt] = useState(null);
    const [instalado, setInstalado] = useState(false);
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {

        window.addEventListener(
            "beforeinstallprompt",
            (e) => {
                e.preventDefault();
                setPrompt(e);
                setVisivel(true);
            }
        );

        window.addEventListener(
            "appinstalled",
            () => {
                setInstalado(true);
                setVisivel(false);
            }
        );

        const jaPWA = window.matchMedia(
            "(display-mode: standalone)"
        ).matches;

        if (jaPWA) setVisivel(false);
    }, []);

    async function instalar() {
        if (!prompt) return;

        prompt.prompt();

        const { outcome } = await prompt.userChoice;

        if (outcome == "accepted") {
            setInstalado(true);
            setVisivel(false);
        }

        setPrompt(null);
    }

    if (!visivel || instalado) return null;

    return (
        <div className="banner-instalar">
            <div className="banner-instalar-texto">
                <strong>Instalar App</strong>
                <span>Adicione o UMADEB à tela inicial</span>
            </div>

            <div className="banner-instalar-acoes">
                <button
                    className="btn-instalar"
                    onClick={instalar}
                >
                    Instalar
                </button>

                <button
                    className="btn-fechar-banner"
                    onClick={() => setVisivel(false)}
                >
                    X
                </button>
            </div>
        </div>
    )
}