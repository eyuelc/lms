<template>
	<div class="monaco-wrapper">
		<div ref="editorContainer" class="monaco-host"></div>
	</div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const __ = window.__ || ((text) => text);
const MONACO_BASE_URL =
	"/assets/dsa/node_modules/monaco-editor/min/vs";

let monacoPromise;

const props = defineProps({
	modelValue: {
		type: String,
		default: "",
	},
	language: {
		type: String,
		default: "cpp",
	},
});

const emit = defineEmits(["update:modelValue"]);

const editorContainer = ref(null);

let editor = null;
let disposed = false;
let themeChangeHandler = null;
let themeObserver = null;

function loadMonaco() {
	if (window.monaco) {
		return Promise.resolve(window.monaco);
	}

	if (monacoPromise) {
		return monacoPromise;
	}

	monacoPromise = new Promise((resolve, reject) => {
		const configure = () => {
			window.require.config({
				paths: {
					vs: MONACO_BASE_URL,
				},
			});

			window.MonacoEnvironment = {
				getWorkerUrl() {
					const worker = `
						self.MonacoEnvironment = {
							baseUrl: '${MONACO_BASE_URL}/'
						};

						importScripts(
							'${MONACO_BASE_URL}/base/worker/workerMain.js'
						);
					`;

					return `data:text/javascript;charset=utf-8,${encodeURIComponent(
						worker
					)}`;
				},
			};

			window.require(
				["vs/editor/editor.main"],
				() => resolve(window.monaco),
				reject
			);
		};

		if (window.require?.config) {
			configure();
			return;
		}

		const script = document.createElement("script");

		script.src = `${MONACO_BASE_URL}/loader.js`;

		script.onload = configure;

		script.onerror = () => {
			reject(new Error(__("Could not load the Monaco editor.")));
		};

		document.head.appendChild(script);
	});

	return monacoPromise;
}

/*
 * Theme detection.
 *
 * The DSA pages put data-theme on <body>. Frappe Desk and the LMS put it on
 * <html> (data-theme / data-theme-mode) or use a `dark` class. Check all of
 * them so the editor matches whichever page it is embedded in.
 * There is deliberately NO prefers-color-scheme fallback: the editor must
 * follow the site theme, not the OS.
 */
function getSiteTheme() {
	for (const element of [document.body, document.documentElement]) {
		if (!element) continue;

		for (const attribute of ["data-theme", "data-theme-mode"]) {
			const value = element.getAttribute(attribute);

			if (value === "dark" || value === "light") {
				return value;
			}
		}

		if (element.classList.contains("dark")) {
			return "dark";
		}
	}

	return window.dsaTheme?.get?.() === "dark" ? "dark" : "light";
}

function monacoThemeName(theme) {
	return theme === "dark" ? "vs-dark" : "vs";
}

function applyMonacoTheme(theme = getSiteTheme()) {
	if (!window.monaco?.editor || !editor || disposed) {
		return;
	}

	window.monaco.editor.setTheme(monacoThemeName(theme));
}

onMounted(async () => {
	try {
		const monaco = await loadMonaco();

		if (disposed || !editorContainer.value) {
			return;
		}

		editor = monaco.editor.create(editorContainer.value, {
			value: props.modelValue,
			language: props.language,
			theme: monacoThemeName(getSiteTheme()),

			automaticLayout: true,

			minimap: {
				enabled: false,
			},

			fontSize: 13,
			lineNumbers: "on",
			scrollBeyondLastLine: false,
			tabSize: 4,

			// The editor sits inside a clipped, scrolling lesson page:
			// keep suggestion/hover widgets from being cut off, and don't
			// swallow the mouse wheel when the editor can't scroll further.
			fixedOverflowWidgets: true,
			scrollbar: {
				alwaysConsumeMouseWheel: false,
			},

			padding: {
				top: 10,
				bottom: 10,
			},
		});

		editor.onDidChangeModelContent(() => {
			if (!editor || disposed) {
				return;
			}

			emit("update:modelValue", editor.getValue());
		});

		themeChangeHandler = (event) => {
			applyMonacoTheme(event.detail?.theme || getSiteTheme());
		};

		window.addEventListener("dsa-theme-change", themeChangeHandler);

		// LMS / Desk switch theme by changing attributes on <html> or <body>
		// without firing a custom event, so watch for that too.
		themeObserver = new MutationObserver(() => applyMonacoTheme());

		for (const target of [document.documentElement, document.body]) {
			themeObserver.observe(target, {
				attributes: true,
				attributeFilter: ["data-theme", "data-theme-mode", "class"],
			});
		}

		applyMonacoTheme();
	} catch (error) {
		console.error("Failed to initialize Monaco Editor:", error);
	}
});

watch(
	() => props.modelValue,
	(value) => {
		if (!editor) {
			return;
		}

		if (value !== editor.getValue()) {
			editor.setValue(value);
		}
	}
);

watch(
	() => props.language,
	(language) => {
		if (!editor?.getModel()) {
			return;
		}

		window.monaco.editor.setModelLanguage(editor.getModel(), language);
	}
);

function layout() {
	editor?.layout();
}

function setTheme(theme) {
	applyMonacoTheme(theme);
}

defineExpose({
	layout,
	setTheme,
});

onBeforeUnmount(() => {
	disposed = true;

	if (themeChangeHandler) {
		window.removeEventListener("dsa-theme-change", themeChangeHandler);
	}

	themeChangeHandler = null;

	themeObserver?.disconnect();
	themeObserver = null;

	editor?.dispose();
	editor = null;
});
</script>

<style scoped>
.monaco-wrapper,
.monaco-host {
	width: 100%;
	height: 100%;
}

.monaco-wrapper {
	min-width: 0;
	overflow: hidden;
}
</style>