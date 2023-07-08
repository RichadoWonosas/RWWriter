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

function setupRubyElement(raw_html) {
    let match = ruby_exp.exec(raw_html);
    while (match !== null) {
        raw_html =
            raw_html.substring(0, match.index) +
            match[0]
                .replace("{", "<ruby>")
                .replace("}", "</ruby>")
                .replaceAll("[", "<rt>")
                .replaceAll("]", "</rt>") +
            raw_html.substring(match.index + match[0].length);

        match = ruby_exp.exec(raw_html);
    }

    return raw_html;
}

function renderMarkdownData(text) {
    let t = marked.parse(text);
    return setupRubyElement(t);
}

function setupMarkdownData(raw_html, container) {
    container.innerHTML = raw_html;
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

function initialise() {
    let t = getCookie("content");
    md_content.value = t === undefined ? '' : t;

}

// Initialisation

const art_main = document.getElementById("art_main");
const md_content = document.getElementById("md_content");
const word_count = document.getElementById("word_count");

const vacantDiv = document.createElement("div");

md_content.oninput = () => {
    let t = md_content.value;

    setCookie("content", t);

    t = renderMarkdownData(t);
    setupMarkdownData(t, art_main);
    word_count.innerText = `字数：${countWord(t)}`;
}

const ruby_exp = /\{(([^\{\[\]\}]|\s)+\[([^\{\[\]\}]|\s)+\])+\}/;

initialise();
