"use strict";

import {helper} from "/scripts/helper.js";
import {marked} from "./tps/marked.esm.js";

// Constants

const root_div = document.getElementById("root_div");
const art_main = document.getElementById("art_main");
const md_content = document.getElementById("md_content");
const word_count = document.getElementById("word_count");
const download_url = document.createElement("a");
const art_upload = document.createElement("input");

const vacantDiv = document.createElement("div");
const reader = new FileReader();

// Functions

let renderWordCount = (count) => word_count.innerText = `字数：${count}`;

const setupRubyElement = (text) => {
    let result = '', reg = [[], []], tmp = '';
    let status = 0;

    if (typeof text !== 'string')
        return result;
    if (text.length === 0)
        return result;

    // run state machine
    for (let i = 0; i < text.length; i++) {
        switch (status) {
            default:
            case 0:
                if (text[i] !== '{') {
                    result += text[i];
                } else {
                    status = 1;
                }
                break;
            case 1:
                switch (text[i]) {
                    case '{':
                        reg[0].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}`;
                        break;
                    case '}':
                    case ']':
                    case '\n':
                    case '\r':
                        reg[0].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}${text[i]}`;
                        status = 0;
                        reg[0] = [];
                        break;
                    case '[':
                        reg[0].push(tmp);
                        tmp = "";
                        status = 2;
                        break;
                    case '-':
                        reg[0].push(tmp);
                        tmp = "";
                        break;
                    case '\\':
                        i++;
                        if (i >= text.length) {
                            tmp += '\\';
                            break;
                        }
                        tmp += text[i];
                        break;
                    default:
                        tmp += text[i];
                        break;
                }
                break;
            case 2:
                switch (text[i]) {
                    case ']':
                        reg[1].push(tmp);
                        tmp = "";
                        status = 3;
                        break;
                    case '{':
                        reg[1].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}`;
                        status = 1;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case '}':
                    case '[':
                    case '\n':
                    case '\r':
                        reg[1].push(tmp);
                        tmp = "";
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}${text[i]}`;
                        status = 0;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case '-':
                        reg[1].push(tmp);
                        tmp = "";
                        break;
                    case '\\':
                        i++;
                        if (i >= text.length) {
                            tmp += '\\';
                            break;
                        }
                        tmp += text[i];
                        break;
                    default:
                        tmp += text[i];
                        break;
                }
                break;
            case 3:
                switch (text[i]) {
                    case '}':
                        let l0 = reg[0].length, l1 = reg[1].length;
                        if (l1 > l0)
                            reg[1][l0 - 1] = reg[1].slice(l0 - 1).join("");
                        for (let i = l1; i < l0; i++)
                            reg[1].push("");

                        result += "<ruby>";
                        for (let i = 0; i < l0; i++)
                            result += `${reg[0][i]}<rp>(</rp><rt>${reg[1][i]}</rt><rp>)</rp>`;
                        result += "</ruby>";
                        status = 0;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case '{':
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}]`;
                        status = 1;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                    case ' ':
                        break;
                    default:
                        result += `{${reg[0].join('-')}[${reg[1].join('-')}]${text[i]}`;
                        status = 0;
                        reg[0] = [];
                        reg[1] = [];
                        break;
                }
        }
    }

    // append unused contents
    switch (status) {
        default:
        case 0:
            break;
        case 1:
            reg[0].push(tmp);
            tmp = "";
            result += `{${reg[0].join('-')}`;
            break;
        case 2:
            reg[1].push(tmp);
            tmp = "";
            result += `{${reg[0].join('-')}[${reg[1].join('-')}`;
            break;
        case 3:
            result += `{${reg[0].join('-')}[${reg[1].join('-')}]`;
            break;
    }

    return result;
};

const renderMarkdownData = (text) => {
    let t = marked.parse(text);
    return setupRubyElement(t);
};

const setupMarkdownData = (raw_html, container) => {
    container.innerHTML = raw_html;
};

const updateMarkdownPreview = () => {
    let t = md_content.value;

    localStorage.setItem("writer_content", t);

    t = renderMarkdownData(t);
    setupMarkdownData(t, art_main);
    renderWordCount(countWord(t));
};

const countWord = (text) => {
    // get pure content
    vacantDiv.innerHTML = text;
    let t = vacantDiv.textContent;
    // count
    let result = 0;
    if (t === null) {
        return result;
    }
    let words = t.replaceAll('\n', ' ').split(/\b|\s+/).filter(s => ((s !== ' ') && (s !== '')));
    words.forEach(
        word => {
            let w = word.replaceAll(' ', '');
            if (/[0-9a-zA-Z]/.test(w[0])) {
                result += 1;
            } else {
                result += w.length;
            }
        }
    )
    vacantDiv.innerHTML = "";
    return result;
};

const renderNumberForLiteralChinese = (number) => {
    const NUMBERS = "〇一二三四五六七八九";
    const SMALL_DIGITS = "個十百千";
    const LARGE_DIGITS = "萬億兆京垓秭穰溝澗正载";
    let result = "";
    let flag = "";

    if (number === 0)
        return "〇";
    if (number < 0) {
        flag = "负";
        number = -number;
    }

    let i = 0;
    while (number > 0) {
        let rem = number % 10;
        number = (number - rem) / 10;
        if (i === 0) {
            if (rem > 0)
                result += NUMBERS[rem];
        } else {
            if ((i & 3) === 0) {
                let d = i >>> 2, j = 0;
                while ((d & 1) === 0) {
                    d >>>= 1;
                    j++;
                }
                result += LARGE_DIGITS[j];
            } else {
                if (rem > 0)
                    result += SMALL_DIGITS[i & 3];
            }
            if (rem > 0)
                result += NUMBERS[rem];
        }
        i++;
    }
    result += flag;

    return result.split("").reverse().join("");
};

const saveArticle = () => {
    // let content = unicodeToUtf8(md_content.value);
    let blob = new Blob([md_content.value]);
    download_url.href = URL.createObjectURL(blob);
    download_url.download = "new-article.md";
    download_url.click();
};

const saveHtmlArticle = () => {
    let blob = new Blob([art_main.innerHTML]);
    download_url.href = URL.createObjectURL(blob);
    download_url.download = "new-article-html.txt";
    download_url.click();
};

const loadArticle = () => {
    art_upload.click();
};

const loadArticleFromChosenFile = () => {
    reader.abort();
    reader.readAsText(art_upload.files[0], "utf-8");
};

const finishLoadingArticle = () => {
    md_content.value = reader.result;
    updateMarkdownPreview();
};

const initMarked = () => {
    marked.setOptions({mangle: false, headerIds: false});
    // update from old version
    {
        let legacy = localStorage.getItem("content");
        if (legacy !== null) {
            localStorage.setItem("writer_content", legacy);
            localStorage.removeItem("content");
        }
    }
    let t = localStorage.getItem("writer_content");
    if (t === undefined)
        t = '';
    md_content.value = t;
    updateMarkdownPreview();
};

const initLocale = () => {
    helper.importTranslation(window.location.pathname.split("/").slice(0, -1).join("/") + "/resources/localized-strings.json");
    helper.addEventListener("locale", "title", (res) => document.title = res.str);
    helper.addEventListener("locale", "wordcount", (res) => {
        renderWordCount = (res.str !== "計") ?
            ((count) => word_count.innerText = `${res.str}${count}`) :
            ((count) => word_count.innerText = `計${renderNumberForLiteralChinese(count)}言`);
        updateMarkdownPreview();
    });
};

const initSettings = () => {
    helper.addEventListener("size", "root", (res) => {
        if (res.size === 'small') {
            root_div.classList.add('small');
        } else {
            root_div.classList.remove('small');
        }
        if (res.size === 'medium') {
            root_div.classList.add('medium');
        } else {
            root_div.classList.remove('medium');
        }
        if (res.size === 'large') {
            root_div.classList.add('large');
        } else {
            root_div.classList.remove('large');
        }
    });
};

const initElements = () => {
    md_content.oninput = updateMarkdownPreview;

    art_upload.type = "file";
    art_upload.accept = ".md, .txt"
    art_upload.onchange = loadArticleFromChosenFile;
    reader.onloadend = finishLoadingArticle;

    document.onkeydown = (event) => {
        if (event.isComposing || event.keyCode === 229) {
            return;
        }

        let pressed = "";
        pressed += event.ctrlKey ? "Ctrl+" : "";
        pressed += event.altKey ? "Alt+" : "";
        pressed += event.shiftKey ? "Shift+" : "";
        pressed += event.code;

        switch (pressed) {
            case 'Ctrl+KeyS':
                event.preventDefault();
                saveArticle();
                break;
            case 'Ctrl+KeyL':
                event.preventDefault();
                loadArticle();
                break;
            case 'Ctrl+Shift+KeyS':
                event.preventDefault();
                saveHtmlArticle();
        }
    };

    document.oncontextmenu = (event) => {
        if (event.target.id !== 'md_content') {
            event.preventDefault();
        }
    };
};

const buildDrawer = () => {
    let operFrame = helper.drawer.createDrawerContentFrame("oper", "操作");
    {
        let loadContent = operFrame.createContent("import", "导入");
        loadContent.classList.add("button");
        loadContent.onclick = () => loadArticle();
        operFrame.addContent(loadContent);
    }
    {
        let saveContent = operFrame.createContent("save", "保存");
        saveContent.classList.add("button");
        saveContent.onclick = () => saveArticle();
        operFrame.addContent(saveContent);
    }
    {
        let expContent = operFrame.createContent("export", "导出");
        expContent.classList.add("button");
        expContent.onclick = () => saveArticle();
        operFrame.addContent(expContent);
    }
    helper.drawer.addDrawerContentByFrame(operFrame);
};

const initialise = () => {
    initMarked();
    initElements();
    initSettings();
    initLocale();
    buildDrawer();

    helper.loadGlobalConfig();
    helper.drawer.appendToDocument();
};

// Initialisation
initialise();
