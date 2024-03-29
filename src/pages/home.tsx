import { useState, useEffect, useRef } from "preact/hooks";
import { useGlobalState } from "@ekwoka/preact-global-state";
import { Head } from "../components/head";
import { Web, searchWeb } from "../components/web";
import { SearchIcon } from "../assets/searchIcon";
import { geSearchEngine } from "../util/getSearchEngine";
import { CloseIcon } from "../assets/closeIcon";
import { createBareClient } from "@tomphttp/bare-client";
import { bare } from "../settings";

function Home() {
    const [service] = useGlobalState<string>("service", localStorage.getItem("metallic/service") || "ultraviolet");
    const [theme] = useGlobalState<string>("theme", localStorage.getItem("metallic/theme") || "default");
    const [searchEngine] = useGlobalState<string>("engine", localStorage.getItem("metallic/engine") || "google");
    const [webOpen, setWebOpen] = useState(false);
    const search = useRef<HTMLInputElement>();
    const [searchHasValue, setSearchHasValue] = useState(false);
    const [suggestions, setSuggestions] = useState<any>([]);
    let bareClient: any;

    (async () => {
        bareClient = await createBareClient(bare);
    })();

    function clearInput() {
        if (search && search.current) {
            if (!search.current.value) {
                setSuggestions([]);
                setSearchHasValue(false);
            }
        }
    }

    useEffect(() => {
        if (search && search.current) {
            search.current.focus();
        }
    }, [location.pathname])

    const handleSuggestions = async (e: any) => {
        setSearchHasValue(e.target.value !== "");

        if (e.target.value) {
            if (bareClient) {
                try {
                    const site = await bareClient.fetch(
                        "https://duckduckgo.com/ac/?q=" + e.target.value + "&type=list"
                    );
                    const results = await site.json();
                    setSuggestions(results[1].slice(0, 9))
                } catch (err) {
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        } else {
            setSuggestions([]);
        }
    }

    const handleSearch = async (e: any) => {
        if (e.key == "Enter") {
            if (e.target.value) {
                await searchWeb(e.target.value, service, geSearchEngine(searchEngine), webOpen, setWebOpen, e.target, clearInput);
            }
        }
    }

    function clearSearch() {
        if (search && search.current) {
            search.current.value = "";
            clearInput();
            search.current.focus();
        }
    }

    async function clickSuggestion(suggestion: string) {
        await searchWeb(suggestion, service, geSearchEngine(searchEngine), webOpen, setWebOpen, search.current, clearInput);
    }

    return (
        <>
            <Head />
            <Web open={webOpen} setOpen={setWebOpen} />
            {theme == "hub" ? (
                <h1 class="title mt-32 mb-8 sm:mb-16 flex items-center justify-center">
                    <span class="text-4xl sm:text-6xl font-bold text-center font-title">Metal</span>
                    <span class="text-4xl sm:text-6xl font-bold text-center font-title bg-secondary rounded p-1 ml-1 text-textInverse">lic</span>
                </h1>
            ) : (
                <h1 class="title text-4xl sm:text-6xl font-bold text-center mt-32 mb-8 sm:mb-16 font-title">Metallic</h1>
            )}
            <div class="flex flex-col items-center justify-center">
                <div class={"bg-secondary w-[600px] h-14 flex items-center justify-center" + (suggestions.length ? " rounded-[28px_28px_0_0]" : " rounded-full")}>
                    <div class="w-16 h-full flex items-center justify-center shrink-0">
                        <SearchIcon />
                    </div>
                    {/**@ts-ignore */}
                    <input ref={search} autoFocus={true} onKeyUp={handleSearch} onChange={handleSuggestions} class="bg-transparent w-full h-full outline-none text-textInverse" spellcheck={false} autocomplete="off" data-enable-grammarly="false" />
                    <button onClick={clearSearch} class="w-16 h-full flex items-center justify-center shrink-0" style={{ display: searchHasValue ? "flex" : "none" }}>
                        <CloseIcon />
                    </button>
                </div>
                <div class={"bg-secondary rounded-[0_0_28px_28px] w-[600px]" + (!suggestions.length ? " hidden" : "")}>
                    {suggestions.map((suggestion: string) => (
                        <div onClick={() => clickSuggestion(suggestion)} class="h-14 flex items-center cursor-pointer px-4 select-none" key={suggestion}>{suggestion}</div>
                    ))}
                </div>
            </div>
        </>
    )
}

export { Home };