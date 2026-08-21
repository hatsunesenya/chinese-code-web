// ===== 电码表 =====
import { CODEBOOK, REVERSE_CODEBOOK } from "./TelegraphBook_FULL.js";

// ===== 模式开关 =====
// 学习模式：输出附带原字符（便于对照学习）；快速模式：仅输出转换结果
let isLearnMode = false;

function toggleMode() {
    isLearnMode = !isLearnMode;
    const toggle = document.getElementById("modeToggle");
    const hint = document.getElementById("modeHint");
    if (isLearnMode) {
        toggle.classList.add("is-learn");
        toggle.setAttribute("aria-pressed", "true");
        hint.textContent = "输出附带原字符，便于对照学习";
    } else {
        toggle.classList.remove("is-learn");
        toggle.setAttribute("aria-pressed", "false");
        hint.textContent = "仅输出转换结果";
    }
}

// ===== 汉字 → 电码 =====
function hanziToCode() {
    if (isLearnMode) {
        const input = document.getElementById("inputText").value;
        let result = [];
        for (const ch0 of input) {
            // 小写西里尔字母 → 大写后查表
            const ch = _isCyrillicLower(ch0) ? ch0.toUpperCase() : ch0;
            if (CODEBOOK[ch]) result.push(`${ch} ${CODEBOOK[ch]}`);
            else if (/\s/.test(ch)) result.push(ch);
            else result.push(`${ch} ????`);
        }
        document.getElementById("outputText").value = result.join(" ");
    } else {
        const input = document.getElementById("inputText").value;
        let output = "";
        const punctuation = "【】〈〉～〖〗〔〕　";

        for (const c0 of input) {
            // 小写西里尔字母 → 大写后查表
            const c = _isCyrillicLower(c0) ? c0.toUpperCase() : c0;
            if (CODEBOOK[c]) {
                output += CODEBOOK[c];
            } else if (_isAsciiLetter(c)) {
                // ASCII 字母：输出大写
                output += c.toUpperCase();
            // 在 else if 分支:
            } else if (c === " " || c === "\t" || c === "\n" || c === "\r") {
                // 换行：原样输出
                output += c;
            } else if (c.charCodeAt(0) < 128 || punctuation.includes(c)) {
                // 标点符号等：输出空格
                output += " ";
            } else {
                // 非汉字字符（如未收录的汉字等）：输出9999
                output += "9999";
            }
        }

        // strip_edges() 等价于 trim()
        document.getElementById("outputText").value = output.trim();
    }

}

// ===== 电码 → 汉字 =====
function codeToHanzi() {
    if(isLearnMode){
        const input = document.getElementById("inputText").value.trim().split(/\s+/);
        let result = [];
        for (const item of input) {
            if (REVERSE_CODEBOOK[item]) result.push(`${item} ${REVERSE_CODEBOOK[item]}`);
            else if (/^\d{4}$/.test(item)) result.push(`${item} <UNK>`);
            else result.push(item);
        }
        document.getElementById("outputText").value = result.join(" ");
    } else {
        const input = document.getElementById("inputText").value;
        let output = "";
        let i = 0;
        const n = input.length;

        while (i < n) {
            const c = input[i];

            if (c === " " || c === "\t" || c === "\n" || c === "\r") {
                // 空白字符：原样输出
                output += c;
                i++;
            } else if (_isAsciiLetter(c)) {
                // 字母：原样输出
                output += c;
                i++;
            } else if (_isAsciiDigit(c)) {
                // 数字：需要凑齐4位
                if (i + 4 > n) {
                    // 剩余不足4位，无法构成电码，结束
                    break;
                }
                const chunk = input.substring(i, i + 4); // GDScript: substr(i, 4)
                if (!_allDigits(chunk)) {
                    // 4位中混入了空格/字母等杂质，非法组合
                    output += "【错误】";
                    i += 4;
                    continue;
                }
                if (Object.prototype.hasOwnProperty.call(REVERSE_CODEBOOK, chunk)) {
                    output += REVERSE_CODEBOOK[chunk];
                    i += 4;
                } else {
                    // 4位都是数字但查表无果
                    output += "■";
                    i += 4;
                }
            } else {
                // 其他字符（标点等）：原样输出
                output += c;
                i++;
            }
        }

        // 将结果写回输出框
        document.getElementById("outputText").value = output.trim();
    }
}

// ===== 自动粘贴原文 + 一键复制结果 =====
async function _autoConvert(convertFn) {
    // 自动粘贴：从剪贴板读取原文写入输入框
    try {
        const text = await navigator.clipboard.readText();
        if (text) document.getElementById("inputText").value = text;
    } catch (e) { /* 剪贴板读取失败则使用输入框现有内容 */ }
    convertFn();
    // 一键复制：把转换结果写入剪贴板
    const out = document.getElementById("outputText").value;
    try {
        await navigator.clipboard.writeText(out);
    } catch (e) { /* 复制失败则忽略 */ }
}

function hanziToCodeAuto() { _autoConvert(hanziToCode); }
function codeToHanziAuto() { _autoConvert(codeToHanzi); }

// ===== 复制翻译结果 / 粘贴到输入框 =====
async function copyResult() {
    const text = document.getElementById("outputText").value;
    try {
        await navigator.clipboard.writeText(text);
    } catch (e) { /* 复制失败则忽略 */ }
}
 
async function pasteToInput() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) document.getElementById("inputText").value = text;
    } catch (e) { /* 剪贴板读取失败则使用输入框现有内容 */ }
}

// ===== 清空输入框和输出框 =====
function emptyInOut() {
    document.getElementById("inputText").value = "";
    document.getElementById("outputText").value = "";
}

// ===== TXT 导入 =====
function importTxt() { document.getElementById("fileInput").click(); }
document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) { document.getElementById("inputText").value = e.target.result; };
    reader.readAsText(file, "utf-8");
});

// ===== TXT 导出 =====
function exportTxt() {
    const content = document.getElementById("outputText").value;
    if (!content) { alert("当前没有可导出的内容。"); return; }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "conversion_result.txt"; a.click();
    URL.revokeObjectURL(url);
}

// ===== About 弹窗 =====
function openAbout() { document.getElementById("about-overlay").classList.remove("hidden"); }
function closeAbout() { document.getElementById("about-overlay").classList.add("hidden"); }

// ===== PWA 安装提示 =====
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredPrompt = e;
    if (!localStorage.getItem("pwa-install-dismissed")) document.getElementById("install-overlay").classList.remove("hidden");
    const installBtn = document.getElementById("install-btn");
    if (installBtn) installBtn.style.display = "inline-block";
});

function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => { deferredPrompt = null; closeInstall(); });
}

function closeInstall() {
    document.getElementById("install-overlay").classList.add("hidden");
    localStorage.setItem("pwa-install-dismissed", "true");
}

// ===== 用户随时点击按钮安装 =====
document.getElementById("install-btn").addEventListener("click", () => {
    if (!deferredPrompt) { alert("当前浏览器不支持 PWA 安装或已安装。你可以尝试手动将本网页添加至主屏幕中。"); return; }
    installApp();
});

// ASCII 字母判断
function _isAsciiLetter(c) {
    const code = c.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

// ASCII 数字判断
function _isAsciiDigit(c) {
    const code = c.charCodeAt(0);
    return code >= 48 && code <= 57;
}

// ASCII 是否为全数字
function _allDigits(s) {
    for (let j = 0; j < s.length; j++) {
        if (!_isAsciiDigit(s[j])) {
            return false;
        }
    }
    return true;
}

// 西里尔小写字母判断（Basic + Supplement，含 ё 等）
function _isCyrillicLower(c) {
    return /\p{Ll}/u.test(c) && /\p{Script=Cyrillic}/u.test(c);
}


// ES 模块作用域内的函数需挂到 window，HTML 的 onclick 才能访问
window.toggleMode = toggleMode;
window.hanziToCode = hanziToCode;
window.codeToHanzi = codeToHanzi;
window.hanziToCodeAuto = hanziToCodeAuto;
window.codeToHanziAuto = codeToHanziAuto;
window.copyResult = copyResult;
window.pasteToInput = pasteToInput;
window.emptyInOut = emptyInOut;
window.importTxt = importTxt;
window.exportTxt = exportTxt;
window.openAbout = openAbout;
window.closeAbout = closeAbout;
window.installApp = installApp;
window.closeInstall = closeInstall;
