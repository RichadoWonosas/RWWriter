"use-strict";

// Functions

function setCookie(name, content, expire_time = 1e8) {
    document.cookie =
        name + '=' + content.toString() + '; ' +
        'max-age=' + expire_time.toString();
}

function getCookie(name) {
    let cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        let contents = cookies[i].split('=', 2);
        if (contents[0] === name) {
            if (contents.length > 1) {
                return contents[1];
            } else {
                return '';
            }
        }
    }
}

function setupRubyElement(text) {
    let result = '', reg = ['', ''];
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
                continue;
            case 1:
                switch (text[i]) {
                    case '{':
                        result += `{${reg[0]}`;
                        continue;
                    case '}':
                    case ']':
                        result += `{${reg[0]}${text[i]}`;
                        status = 0;
                        reg[0] = "";
                        continue;
                    case '[':
                        status = 2;
                        continue;
                    default:
                        reg[0] += text[i];
                        continue;
                }
            case 2:
                switch (text[i]) {
                    case ']':
                        status = 3;
                        continue;
                    case '{':
                        result += `{${reg[0]}[${reg[1]}`;
                        status = 1;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    case '}':
                    case '[':
                        result += `{${reg[0]}[${reg[1]}${text[i]}`;
                        status = 0;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    default:
                        reg[1] += text[i];
                        continue;
                }
            case 3:
                switch (text[i]) {
                    case '}':
                        result += `<ruby>${reg[0]}<rt>${reg[1]}</rt></ruby>`;
                        status = 0;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    case '{':
                        result += `{${reg[0]}[${reg[1]}]`;
                        status = 1;
                        reg[0] = "";
                        reg[1] = "";
                        continue;
                    default:
                        result += `{${reg[0]}[${reg[1]}]${text[i]}`;
                        status = 0;
                        reg[0] = "";
                        reg[1] = "";
                    case ' ':
                        continue;
                }
        }
    }

    // append unused contents
    switch (status) {
        default:
        case 0:
            break;
        case 1:
            result += `{${reg[0]}`;
            break;
        case 2:
            result += `{${reg[0]}[${reg[1]}`;
            break;
        case 3:
            result += `{${reg[0]}[${reg[1]}]`;
            break;
    }

    return result;
}

function renderMarkdownData(text) {
    let t = marked.parse(text);
    return setupRubyElement(t);
}

function setupMarkdownData(raw_html, container) {
    container.innerHTML = raw_html;
}

function updateMarkdownPreview() {
    let t = md_content.value;

    localStorage.setItem("content", t);

    t = renderMarkdownData(t);
    setupMarkdownData(t, art_main);
    word_count.innerText = `字数：${countWord(t)}`;
}

function countWord(text) {
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
    return result;
}

function saveArticle() {
    // let content = unicodeToUtf8(md_content.value);
    let blob = new Blob([md_content.value]);
    download_url.href = URL.createObjectURL(blob);
    download_url.download = "new-article.md";
    download_url.click();
}

function saveHtmlArticle() {
    let blob = new Blob([art_main.innerHTML]);
    download_url.href = URL.createObjectURL(blob);
    download_url.download = "new-article-html.txt";
    download_url.click();
}

function loadArticle() {
    art_upload.click();
}

function loadArticleFromChosenFile() {
    reader.abort();
    reader.readAsText(art_upload.files[0], "utf-8");
}

function finishLoadingArticle() {
    md_content.value = reader.result;
    updateMarkdownPreview();
}

function initialise() {
    marked.setOptions({ mangle: false, headerIds: false });
    let t = localStorage.getItem("content");
    if (t === undefined)
        t = '';

    md_content.value = t;
    updateMarkdownPreview();
}

// Initialisation

const art_main = document.getElementById("art_main");
const md_content = document.getElementById("md_content");
const word_count = document.getElementById("word_count");
const download_url = document.createElement("a");
const art_upload = document.createElement("input");

const vacantDiv = document.createElement("div");
const reader = new FileReader();

md_content.oninput = updateMarkdownPreview;

const ruby_exp = /\{([^\{\[\]\}]|\s)+\[([^\{\[\]\}]|\s)+\]\s*\}/;

art_upload.type = "file";
art_upload.accept = ".md, .txt"
art_upload.onchange = loadArticleFromChosenFile;
reader.onloadend = finishLoadingArticle;

document.onkeydown = event => {
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
}

document.oncontextmenu = event => {
    if (event.target.id !== 'md_content') {
        event.preventDefault();
    }
}

initialise();
