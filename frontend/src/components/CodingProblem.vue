<template>
	<div class="cp-root">
		<div class="cp-page-title">{{ __("CODING PROBLEM") }}</div>

		<div class="coding-problem">
			<header class="cp-header">
				<div class="cp-heading">
					<span class="cp-glyph" aria-hidden="true">&lt;/&gt;</span>
					<div class="cp-title" role="heading" aria-level="3">
						{{ problem?.title || __("Coding Problem") }}
					</div>
				</div>

				<div v-if="problem" class="cp-badges">
					<span
						v-if="problem.difficulty"
						class="cp-badge cp-difficulty"
						:class="difficultyClass"
					>
						{{ problem.difficulty }}
					</span>
					<span v-if="problem.xp_reward > 0" class="cp-badge cp-badge-xp">
						{{ problem.xp_reward }} XP
					</span>
					<span v-if="problem.solved" class="cp-badge cp-badge-solved">
						✓ {{ __("Solved") }}
					</span>
					<button
						type="button"
						class="cp-link-btn"
						:aria-expanded="!problemCollapsed"
						@click="problemCollapsed = !problemCollapsed"
					>
						{{ problemCollapsed ? __("Show problem") : __("Hide problem") }}
						<svg
							class="cp-chevron"
							:class="{ 'is-open': !problemCollapsed }"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>
				</div>
			</header>

			<div v-if="loading" class="cp-skeleton" aria-busy="true">
				<span style="width: 38%"></span>
				<span style="width: 92%"></span>
				<span style="width: 84%"></span>
				<span style="width: 60%"></span>
			</div>

			<div v-else-if="loadError" class="cp-load-error" role="alert">
				<span>{{ loadError }}</span>
				<button type="button" class="cp-btn cp-run" @click="loadProblem">
					{{ __("Retry") }}
				</button>
			</div>

			<template v-else-if="problem">
				<div v-show="!problemCollapsed" class="cp-problem">
					<div v-if="hasFacts" class="cp-facts">
						<span
							v-for="topic in problem.topics || []"
							:key="topic"
							class="cp-chip cp-chip-topic"
						>
							{{ topic }}
						</span>
						
					</div>

					<section
						v-for="section in sections"
						:key="section.key"
						class="cp-section"
					>
						<button
							type="button"
							class="cp-section-toggle"
							:aria-expanded="openSections[section.key]"
							@click="openSections[section.key] = !openSections[section.key]"
						>
							<svg
								class="cp-chevron"
								:class="{ 'is-open': openSections[section.key] }"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m9 6 6 6-6 6" />
							</svg>
							{{ section.label }}
						</button>

						<div
							v-show="openSections[section.key]"
							class="cp-rich"
							v-html="section.html"
						></div>
					</section>
				</div>

				<div class="cp-workspace">
					<section class="cp-card" :aria-label="__('Code editor')">
						<div class="cp-toolbar">
							<div class="cp-toolbar-group">
								<label class="cp-lang">
									<span class="cp-sr-only">{{ __("Programming language") }}</span>
									<select
										v-model.number="languageId"
										:disabled="busy"
										@change="changeLanguage"
									>
										<option
											v-for="language in languages"
											:key="language.id"
											:value="language.id"
										>
											{{ language.label }}
										</option>
									</select>
									<svg
										class="cp-lang-chevron"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="m6 9 6 6 6-6" />
									</svg>
								</label>

								<button
									type="button"
									class="cp-icon-btn"
									:disabled="busy"
									:title="__('Reset to starter code')"
									:aria-label="__('Reset to starter code')"
									@click="resetCode"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M3 12a9 9 0 1 0 3-6.7" />
										<path d="M3 4v5h5" />
									</svg>
								</button>
							</div>

							<div class="cp-toolbar-group">
								<button
									type="button"
									class="cp-btn cp-run"
									:disabled="busy"
									:aria-busy="running"
									@click="runCode"
								>
									<span v-if="busy" class="cp-spinner" aria-hidden="true"></span>
									<svg
										v-else
										class="cp-btn-icon"
										viewBox="0 0 24 24"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M7 4.5v15l13-7.5-13-7.5z" />
									</svg>
									{{ __("Run") }}
								</button>

								<button
									type="button"
									class="cp-btn cp-submit"
									:disabled="busy"
									:aria-busy="submitting"
									@click="submitCode"
								>
									<span v-if="busy" class="cp-spinner" aria-hidden="true"></span>
									<svg
										v-else
										class="cp-btn-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
									{{ __("Submit") }}
								</button>
							</div>
						</div>

						<div class="cp-editor-area">
							<MonacoEditor
								ref="monacoEditor"
								v-model="code"
								:language="currentLanguage"
							/>
						</div>
					</section>

					<section class="cp-card cp-terminal" :aria-label="__('Terminal')">
						<div class="cp-terminal-header">
							<div class="cp-result-tabs" role="tablist">
								<button
									type="button"
									role="tab"
									:aria-selected="activeTab === 'testcase'"
									:class="{ 'is-active': activeTab === 'testcase' }"
									@click="activeTab = 'testcase'"
								>
									<span class="cp-green">☑</span>
									{{ __("Testcase") }}
								</button>

								<button
									type="button"
									role="tab"
									:aria-selected="activeTab === 'result'"
									:class="{ 'is-active': activeTab === 'result' }"
									@click="activeTab = 'result'"
								>
									<span class="cp-green">&gt;_</span>
									{{ __("Test Result") }}
								</button>
							</div>

							<button
								v-if="activeTab === 'result' && (outcome || terminalError) && !busy"
								type="button"
								@click="clearResults"
							>
								{{ __("Clear") }}
							</button>
						</div>

						<div class="cp-terminal-body">
							<div v-if="activeTab === 'testcase'" class="cp-testcase">
								<div class="cp-case-tabs">
									<button
										v-for="(testCase, index) in testCases"
										:key="testCase.key"
										type="button"
										:class="{ 'is-active': activeCaseIndex === index }"
										@click="activeCaseIndex = index"
									>
										{{ __("Case") }} {{ index + 1 }}
									</button>

									<button
										type="button"
										class="cp-add-case"
										:title="__('Add test case')"
										:aria-label="__('Add test case')"
										@click="addTestCase"
									>
										+
									</button>
								</div>

								<label :for="inputId">{{ __("Input") }} =</label>
								<textarea
									:id="inputId"
									v-model="testCases[activeCaseIndex].input"
									spellcheck="false"
									:placeholder="__('Enter input passed to your program…')"
								></textarea>
							</div>

							<template v-else>
								<div v-if="busy" class="cp-muted">
									{{ __("Running…") }}
								</div>

								<div v-else-if="outcome" class="cp-results">
									<div class="cp-result-summary">
										<strong :class="`is-${outcome.tone}`">
											{{ outcome.label }}
										</strong>

										<span v-if="outcome.runtime">
											{{ __("Runtime") }}: {{ outcome.runtime }}
										</span>
										<span v-if="outcome.memory">
											{{ __("Memory") }}: {{ outcome.memory }}
										</span>
									</div>

									<div v-if="xpLine" class="cp-xp-line" :class="`is-${xpLine.tone}`">
										<strong v-if="xpLine.tone === 'awarded'">{{ xpLine.text }}</strong>
										<span v-else>{{ xpLine.text }}</span>
										<span v-if="xpLine.sub">{{ xpLine.sub }}</span>
									</div>

									<div v-if="hasComplexity" class="cp-complexity-info">
										<div
											v-for="row in complexityRows"
											:key="row.label"
											class="cp-complexity-row"
										>
											<label>{{ row.label }}</label>
											<span>
												<span
													class="cp-complexity-value"
													:class="complexityClass(row.result)"
													>{{ row.value || __("Unknown") }}</span
												>
												<span
													class="cp-complexity-result"
													:class="complexityClass(row.result)"
												>
													<span class="cp-complexity-icon" aria-hidden="true">{{
														complexityIcon(row.result)
													}}</span>
													{{ row.result || __("Unknown") }}
												</span>
											</span>
										</div>
									</div>

									<div class="cp-case-tabs cp-result-cases">
										<button
											v-for="(testCase, index) in outcome.cases"
											:key="testCase.index"
											type="button"
											:class="{ 'is-active': activeResultCaseIndex === index }"
											@click="activeResultCaseIndex = index"
										>
											<span
												:class="
													testCase.status === 'Accepted' ? 'cp-case-pass' : 'cp-case-fail'
												"
											>
												■
											</span>
											{{ __("Case") }} {{ testCase.index }}
										</button>
									</div>

									<div v-if="activeCase" class="cp-result-details">
										<label>{{ __("Input") }}</label>
										<pre>{{ activeCase.input || __("No input") }}</pre>

										<template v-if="hasExpected">
											<label>{{ __("Expected Output") }}</label>
											<pre>{{ activeCase.expected_output || __("No output") }}</pre>
										</template>

										<label>{{ activeCaseError ? __("Error") : __("Output") }}</label>
										<pre :class="{ 'is-error': activeCaseError }">{{
											activeCaseError || activeCase.actual_output || __("No output")
										}}</pre>
									</div>
								</div>

								<pre v-else-if="terminalError">{{ terminalError }}</pre>

								<div v-else class="cp-empty-result">
									{{ __("You must run your code first") }}
								</div>
							</template>
						</div>
					</section>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import MonacoEditor from "./MonacoEditor.vue";

const props = defineProps({
	problem: {
		type: String,
		required: true,
	},
});

const __ = window.__ || ((text) => text);

const languages = [
	{ id: 54, label: "C++", monaco: "cpp", starter: "// Write your C++ solution here\n" },
	{ id: 71, label: "Python", monaco: "python", starter: "# Write your Python solution here\n" },
	{
		id: 63,
		label: "JavaScript",
		monaco: "javascript",
		starter: "// Write your JavaScript solution here\n",
	},
	{ id: 62, label: "Java", monaco: "java", starter: "// Write your Java solution here\n" },
];

const problem = ref(null);
const loading = ref(true);
const loadError = ref("");

const languageId = ref(54);
const code = ref("");

const running = ref(false);
const submitting = ref(false);
const busy = computed(() => running.value || submitting.value);

const activeTab = ref("testcase");
const testCases = ref([{ key: 1, input: "" }]);
const activeCaseIndex = ref(0);

const outcome = ref(null);
const terminalError = ref("");
const activeResultCaseIndex = ref(0);

const problemCollapsed = ref(false);
const openSections = reactive({
	description: true,
	examples: true,
	constraints: true,
	hint: false,
});

const monacoEditor = ref(null);

const inputId = `cp-stdin-${Math.random().toString(36).slice(2, 8)}`;

let generation = 0;
let disposed = false;
let nextTestCaseKey = 2;
let previousLanguageId = 54;
let codeDrafts = {};

const currentLanguage = computed(
	() => languages.find((language) => language.id === languageId.value)?.monaco || "cpp"
);

const difficultyClass = computed(() => {
	const value = String(problem.value?.difficulty || "").toLowerCase();
	return ["easy", "medium", "hard"].includes(value) ? `is-${value}` : "";
});

const hasFacts = computed(
	() =>
		Boolean(problem.value?.topics?.length) ||
		Boolean(problem.value?.time_complexity) ||
		Boolean(problem.value?.space_complexity)
);

const sections = computed(() => {
	const data = problem.value;

	if (!data) return [];

	return [
		{ key: "description", label: __("Description"), html: sanitize(data.description) },
		{ key: "examples", label: __("Examples"), html: sanitize(data.examples) },
		{ key: "constraints", label: __("Constraints"), html: sanitize(data.constraints) },
		{ key: "hint", label: __("Hint"), html: sanitize(data.hint) },
	].filter((section) => section.html.trim());
});

const activeCase = computed(() => outcome.value?.cases?.[activeResultCaseIndex.value] || null);

const hasExpected = computed(() => {
	const expected = activeCase.value?.expected_output;
	return expected !== null && expected !== undefined;
});

const activeCaseError = computed(() => {
	const errors = activeCase.value?.errors || [];
	return errors.map((error) => error.text).join("\n");
});

const xpLine = computed(() => {
	const xp = outcome.value?.xp;

	if (!xp) return null;

	if (xp.awarded && Number(xp.gained) > 0) {
		return {
			tone: "awarded",
			text: `+${xp.gained} XP`,
			sub: Number.isFinite(Number(xp.total)) ? `${__("Total XP")}: ${xp.total}` : "",
		};
	}

	if (xp.already_awarded) {
		return { tone: "muted", text: __("Already solved"), sub: "" };
	}

	if (xp.error) {
		return { tone: "error", text: xp.error, sub: "" };
	}

	return null;
});

const hasComplexity = computed(() => {
	const complexity = outcome.value?.complexity;
	return Boolean(complexity && (complexity.time || complexity.space));
});

const complexityRows = computed(() => {
	const complexity = outcome.value?.complexity;

	if (!complexity) return [];

	return [
		{ label: __("Time Complexity"), value: complexity.time, result: complexity.timeResult },
		{ label: __("Space Complexity"), value: complexity.space, result: complexity.spaceResult },
	];
});

function formatRuntime(runtime) {
	const seconds = Number(runtime);

	if (!Number.isFinite(seconds) || seconds < 0) return "";
	if (seconds === 0) return "0 ms";
	if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;

	return `${seconds.toFixed(2)} s`;
}

function formatMemory(memory) {
	const kb = Number(memory);

	if (!Number.isFinite(kb) || kb < 0) return "";
	if (kb === 0) return "0 KB";
	if (kb < 1024) return `${Math.round(kb)} KB`;

	const mb = kb / 1024;

	if (mb < 1024) return `${mb.toFixed(2)} MB`;

	return `${(mb / 1024).toFixed(2)} GB`;
}

function displayStatus(status) {
	const statusMap = {
		accepted: __("Accepted"),
		"wrong answer": __("Wrong Answer"),
		"time limit exceeded": __("Time Limit Exceeded"),
		"compilation error": __("Compilation Error"),
		"runtime error": __("Runtime Error"),
		failed: __("Wrong Answer"),
		running: __("Running"),
		queued: __("Queued"),
		rejected: __("Rejected"),
	};

	return statusMap[String(status || "").toLowerCase()] || status || __("Finished");
}

function toneFor(label) {
	const value = String(label || "").toLowerCase();

	if (!value) return "neutral";
	if (value === "accepted") return "success";
	if (value === "running" || value === "queued") return "pending";

	return "danger";
}

function classifyError(text) {
	return /\berror:|SyntaxError|cannot find symbol|undefined reference|was not declared|expected .* before/i.test(
		text
	)
		? __("Compilation Error")
		: __("Runtime Error");
}

function complexityClass(result) {
	const value = String(result || "").toLowerCase();

	if (value === "optimal") return "optimal";
	if (value === "too complex") return "too-complex";

	return "unknown";
}

function complexityIcon(result) {
	const value = String(result || "").toLowerCase();

	if (value === "optimal") return "✓";
	if (value === "too complex") return "⚠";

	return "";
}

function complexityRejectionLabel(timeResult, spaceResult) {
	const time = timeResult === "Too Complex";
	const space = spaceResult === "Too Complex";

	if (time && space) return __("Time & Space Complexity Exceeded");
	if (time) return __("Time Complexity Exceeded");
	if (space) return __("Space Complexity Exceeded");

	return null;
}

function sanitize(value) {
	const documentNode = new DOMParser().parseFromString(value || "", "text/html");

	for (const element of documentNode.body.querySelectorAll(
		"script,style,iframe,object,embed,link"
	)) {
		element.remove();
	}

	for (const element of documentNode.body.querySelectorAll("*")) {
		for (const attribute of [...element.attributes]) {
			const name = attribute.name.toLowerCase();

			if (
				name.startsWith("on") ||
				(["href", "src"].includes(name) && /^\s*javascript:/i.test(attribute.value))
			) {
				element.removeAttribute(attribute.name);
			}
		}
	}

	return documentNode.body.innerHTML;
}

function extractMessage(data, fallback) {
	try {
		if (data?._server_messages) {
			const messages = JSON.parse(data._server_messages)
				.map((entry) => {
					try {
						return JSON.parse(entry).message;
					} catch {
						return entry;
					}
				})
				.filter(Boolean)
				.join("\n");

			if (messages) {
				return new DOMParser().parseFromString(messages, "text/html").body.textContent;
			}
		}
	} catch {}

	if (typeof data?.exception === "string" && data.exception) {
		return data.exception.replace(/^[\w.]+:\s*/, "");
	}

	if (typeof data?.message === "string" && data.message) {
		return data.message;
	}

	return fallback;
}

async function dsaApi(method, args = {}, options = {}) {
	const { methodType = "GET" } = options;

	let response;

	if (methodType === "POST") {
		response = await fetch(`/api/method/dsa.api.${method}`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				"X-Frappe-CSRF-Token": window.csrf_token || "fetch",
			},
			body: JSON.stringify(args),
		});
	} else {
		const params = new URLSearchParams();

		Object.entries(args).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				params.append(key, value);
			}
		});

		response = await fetch(`/api/method/dsa.api.${method}?${params}`, {
			credentials: "include",
		});
	}

	let data = {};

	try {
		data = await response.json();
	} catch {}

	if (!response.ok || data.exc) {
		throw new Error(extractMessage(data, `DSA API request failed: ${method}`));
	}

	return data.message;
}

function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function starterFor(id) {
	const starters = problem.value?.starter_codes || {};
	const language = languages.find((item) => item.id === id) || languages[0];

	return (
		starters[String(id)] ||
		(id === 54 ? problem.value?.starter_code : "") ||
		language.starter
	);
}

async function loadProblem() {
	loading.value = true;
	loadError.value = "";
	generation += 1;

	try {
		const loaded = await dsaApi("get_problem", { name: props.problem });

		if (disposed) return;

		problem.value = loaded;

		codeDrafts = {};
		languageId.value = 54;
		previousLanguageId = 54;
		code.value = starterFor(54);

		testCases.value = (loaded.test_cases || []).map((testCase) => ({
			key: nextTestCaseKey++,
			input: testCase.input || "",
		}));

		if (!testCases.value.length) {
			testCases.value = [{ key: nextTestCaseKey++, input: "" }];
		}

		activeCaseIndex.value = 0;
		activeTab.value = "testcase";
		clearResults();
	} catch (err) {
		if (disposed) return;

		console.error(err);
		loadError.value = err.message || __("Failed to load coding problem.");
	} finally {
		if (!disposed) loading.value = false;
	}
}

function changeLanguage() {
	codeDrafts[previousLanguageId] = code.value;

	code.value = codeDrafts[languageId.value] ?? starterFor(languageId.value);

	previousLanguageId = languageId.value;

	clearResults();
}

function resetCode() {
	if (busy.value) return;

	if (
		code.value !== starterFor(languageId.value) &&
		!window.confirm(__("Reset the editor to the starter code? Your changes will be lost."))
	) {
		return;
	}

	code.value = starterFor(languageId.value);
	codeDrafts[languageId.value] = code.value;
}

function addTestCase() {
	testCases.value.push({ key: nextTestCaseKey++, input: "" });
	activeCaseIndex.value = testCases.value.length - 1;
}

function clearResults() {
	outcome.value = null;
	terminalError.value = "";
	activeResultCaseIndex.value = 0;
}

function showError(err) {
	console.error(err);

	outcome.value = null;
	terminalError.value = err?.message || __("Something went wrong.");
}

function buildRunOutcome(queued, result, caseIndex, input) {
	const complexity = {
		time: queued.complexity || "",
		space: queued.space_complexity || "",
		timeResult: queued.complexity_result || "",
		spaceResult: queued.space_complexity_result || "",
	};

	const rejection = complexityRejectionLabel(complexity.timeResult, complexity.spaceResult);
	const label = rejection || displayStatus(result.status);

	const errors = [];

	if (result.compile_output) {
		errors.push({ label: __("Compilation Error"), text: result.compile_output });
	}

	if (result.stderr) {
		errors.push({ label: __("Standard Error"), text: result.stderr });
	}

	if (result.message) {
		errors.push({ label: __("Message"), text: result.message });
	}

	return {
		kind: "run",
		pending: false,
		label,
		tone: rejection ? "danger" : toneFor(label),
		runtime: result.time != null ? formatRuntime(result.time) : "",
		memory: result.memory != null ? formatMemory(result.memory) : "",
		passed: 0,
		total: 0,
		xp: null,
		complexity,
		cases: [
			{
				index: caseIndex + 1,
				status: label,
				input,
				expected_output: result.expected_output ?? null,
				actual_output: result.stdout || "",
				errors,
			},
		],
	};
}

async function runCode() {
	if (!problem.value || busy.value) return;

	const current = ++generation;

	running.value = true;
	clearResults();
	activeTab.value = "result";

	try {
		const caseIndex = activeCaseIndex.value;
		const input = testCases.value[caseIndex]?.input || "";

		const queued = await dsaApi(
			"run_code",
			{
				problem: problem.value.name,
				code: code.value,
				stdin: input,
				language_id: languageId.value,
				test_case_index: caseIndex + 1,
			},
			{ methodType: "POST" }
		);

		for (let attempt = 0; attempt < 30; attempt += 1) {
			if (disposed || generation !== current) return;

			const result = await dsaApi("get_run_result", { token: queued.token });

			if (disposed || generation !== current) return;

			if (!result.pending) {
				outcome.value = buildRunOutcome(queued, result, caseIndex, input);
				return;
			}

			await wait(1000);
		}

		throw new Error(__("Execution timed out."));
	} catch (err) {
		if (!disposed && generation === current) showError(err);
	} finally {
		if (!disposed) running.value = false;
	}
}

function buildSubmitOutcome(queued, result) {
	const complexity = {
		time: result.time_complexity || queued.complexity || "",
		space: result.space_complexity || queued.space_complexity || "",
		timeResult: result.complexity_result || queued.complexity_result || "",
		spaceResult: result.space_complexity_result || queued.space_complexity_result || "",
	};

	const rejection = complexityRejectionLabel(complexity.timeResult, complexity.spaceResult);

	const cases = (result.results || []).map((row) => ({
		index: row.index,
		status: rejection || row.status,
		input: row.input || "",
		expected_output: row.expected_output ?? null,
		actual_output: row.actual_output || "",
		errors: row.error ? [{ label: classifyError(row.error), text: row.error }] : [],
	}));

	let label;

	if (rejection) {
		label = rejection;
	} else if (result.pending) {
		label = __("Running");
	} else {
		label = displayStatus(result.display_status || result.status);

		const failedWithError = cases.find(
			(testCase) => testCase.status !== "Accepted" && testCase.errors.length
		);

		if (label === __("Wrong Answer") && failedWithError) {
			label = failedWithError.errors[0].label;
		}
	}

	return {
		kind: "submit",
		pending: Boolean(result.pending),
		label,
		tone: rejection ? "danger" : toneFor(label),
		runtime: result.runtime ? formatRuntime(result.runtime) : "",
		memory: result.memory ? formatMemory(result.memory) : "",
		passed: result.passed_count || 0,
		total: result.total_count || 0,
		xp: result.pending ? null : result.xp || null,
		complexity,
		cases,
	};
}

async function submitCode() {
	if (!problem.value || busy.value) return;

	const current = ++generation;

	submitting.value = true;
	clearResults();
	activeTab.value = "result";

	try {
		const queued = await dsaApi(
			"submit_code",
			{
				problem: problem.value.name,
				code: code.value,
				language_id: languageId.value,
			},
			{ methodType: "POST" }
		);

		for (let attempt = 0; attempt < 60; attempt += 1) {
			if (disposed || generation !== current) return;

			const result = await dsaApi(
				"get_submission_result",
				{ submission: queued.submission },
				{ methodType: "POST" }
			);

			if (disposed || generation !== current) return;

			outcome.value = buildSubmitOutcome(queued, result);

			if (!result.pending) {
				const firstFailed = outcome.value.cases.findIndex(
					(testCase) => testCase.status !== "Accepted"
				);
				activeResultCaseIndex.value = firstFailed === -1 ? 0 : firstFailed;

				if (result.xp?.awarded || result.xp?.already_awarded) {
					problem.value.solved = true;
				}

				return;
			}

			await wait(1000);
		}

		throw new Error(__("Submission timed out."));
	} catch (err) {
		if (!disposed && generation === current) showError(err);
	} finally {
		if (!disposed) submitting.value = false;
	}
}

onMounted(loadProblem);

watch(
	() => props.problem,
	(next, previous) => {
		if (next && next !== previous) loadProblem();
	}
);

onBeforeUnmount(() => {
	disposed = true;
	generation += 1;
});

defineExpose({
	layout: () => monacoEditor.value?.layout(),
});
</script>

<style scoped>
.cp-root {
	width: 100%;
	max-width: 100%;
	min-width: 0;
	margin: 12px 0;
}

.cp-page-title {
	margin: 0 0 10px 2px;
	color: var(--text-muted, color-mix(in srgb, currentColor 62%, transparent));
	font-size: 20px;
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1.3;
	text-transform: uppercase;
}

.coding-problem {
	--cp-border: var(--border-color, color-mix(in srgb, currentColor 18%, transparent));
	--cp-bg: var(--card-bg, transparent);
	--cp-head-bg: var(--control-bg, color-mix(in srgb, currentColor 5%, transparent));
	--cp-hover: var(--fg-hover-color, color-mix(in srgb, currentColor 10%, transparent));
	--cp-muted: var(--text-muted, color-mix(in srgb, currentColor 62%, transparent));

	--cp-blue: var(--text-on-blue, #2563eb);
	--cp-green: var(--text-on-green, #16a34a);
	--cp-red: var(--text-on-red, #dc2626);
	--cp-orange: var(--text-on-orange, #d97706);
	--cp-purple: var(--text-on-purple, #7c3aed);
	--cp-focus: var(--primary, var(--cp-blue));

	--cp-optimal: var(--color-optimal, #28c76f);
	--cp-too-complex: var(--color-too-complex, #e05757);

	--cp-option-bg: var(--control-bg, #ffffff);
	--cp-option-fg: var(--text-color, #222222);
	--cp-mono: var(
		--font-stack-monospace,
		ui-monospace,
		SFMono-Regular,
		Menlo,
		Consolas,
		monospace
	);

	container-type: inline-size;
	width: 100%;
	max-width: 100%;
	min-width: 0;
	margin: 0;
	overflow: hidden;
	border: 1px solid var(--cp-border);
	border-radius: 10px;
	background: var(--cp-bg);
	color: inherit;
	font-size: 13px;
	line-height: 1.5;
	text-align: left;
}

:global([data-theme="dark"]) .coding-problem,
:global([data-theme-mode="dark"]) .coding-problem,
:global(.dark) .coding-problem {
	--cp-blue: var(--text-on-blue, #6ea8fe);
	--cp-green: var(--text-on-green, #5fd68a);
	--cp-red: var(--text-on-red, #ff6b6b);
	--cp-orange: var(--text-on-orange, #f5b84b);
	--cp-purple: var(--text-on-purple, #b78cff);
	--cp-option-bg: var(--control-bg, #252525);
	--cp-option-fg: var(--text-color, #e6e6e6);
}

.coding-problem *,
.coding-problem *::before,
.coding-problem *::after {
	box-sizing: border-box;
}

.coding-problem button,
.coding-problem select,
.coding-problem textarea {
	font-family: inherit;
	color: inherit;
}

.coding-problem button:focus-visible,
.coding-problem select:focus-visible,
.coding-problem textarea:focus-visible {
	outline: 2px solid var(--cp-focus);
	outline-offset: 2px;
}

.cp-sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
}

.cp-header {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px 14px;
	padding: 12px 14px;
	background: var(--cp-head-bg);
}

.cp-heading {
	display: flex;
	min-width: 0;
	align-items: center;
	gap: 8px;
}

.cp-glyph {
	flex-shrink: 0;
	color: var(--cp-green);
	font-family: var(--cp-mono);
	font-size: 13px;
	font-weight: 700;
}

.cp-title {
	min-width: 0;
	margin: 0;
	font-size: 16px;
	font-weight: 650;
	line-height: 1.3;
	overflow-wrap: anywhere;
}

.cp-badges {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.cp-badge {
	display: inline-flex;
	align-items: center;
	padding: 3px 9px;
	border-radius: 12px;
	background: color-mix(in srgb, currentColor 8%, transparent);
	font-size: 11px;
	font-weight: 600;
	line-height: 1.3;
	text-transform: capitalize;
}

.cp-difficulty.is-easy {
	background: color-mix(in srgb, var(--cp-green) 16%, transparent);
	color: var(--cp-green);
}

.cp-difficulty.is-medium {
	background: color-mix(in srgb, var(--cp-orange) 16%, transparent);
	color: var(--cp-orange);
}

.cp-difficulty.is-hard {
	background: color-mix(in srgb, var(--cp-red) 16%, transparent);
	color: var(--cp-red);
}

.cp-badge-xp {
	color: var(--cp-orange);
	font-variant-numeric: tabular-nums;
	text-transform: none;
}

.cp-badge-solved {
	color: var(--cp-green);
}

.cp-link-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 4px;
	border: 0;
	border-radius: 4px;
	background: transparent;
	color: var(--cp-muted);
	font-size: 11px;
	cursor: pointer;
}

.cp-link-btn:hover {
	color: inherit;
}

.cp-chevron {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	transition: transform 0.15s ease;
}

.cp-chevron.is-open {
	transform: rotate(180deg);
}

.cp-section-toggle .cp-chevron.is-open {
	transform: rotate(90deg);
}

.cp-skeleton {
	padding: 18px 14px;
}

.cp-skeleton span {
	display: block;
	height: 10px;
	margin-bottom: 12px;
	border-radius: 5px;
	background: var(--cp-head-bg);
	animation: cp-pulse 1.2s ease-in-out infinite;
}

@keyframes cp-pulse {
	50% {
		opacity: 0.45;
	}
}

.cp-load-error {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin: 12px;
	padding: 12px 14px;
	border: 1px solid color-mix(in srgb, var(--cp-red) 45%, transparent);
	border-radius: 8px;
	background: color-mix(in srgb, var(--cp-red) 9%, transparent);
	color: var(--cp-red);
}

.cp-problem {
	max-height: 460px;
	overflow-y: auto;
	padding: 12px 14px 4px;
	border-top: 1px solid var(--cp-border);
	overscroll-behavior: contain;
}

.cp-facts {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 10px;
}

.cp-chip {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 9px;
	border: 1px solid var(--cp-border);
	border-radius: 999px;
	background: var(--cp-head-bg);
	font-size: 11px;
	font-variant-numeric: tabular-nums;
	line-height: 1.4;
}

.cp-chip-topic {
	border-color: transparent;
	background: color-mix(in srgb, var(--cp-blue) 14%, transparent);
	color: var(--cp-blue);
}

.cp-k {
	color: var(--cp-muted);
	font-weight: 600;
}

.cp-section {
	margin-bottom: 8px;
	padding-bottom: 8px;
	border-bottom: 1px solid var(--cp-border);
}

.cp-section:last-child {
	border-bottom: 0;
}

.cp-section-toggle {
	display: flex;
	width: 100%;
	align-items: center;
	gap: 4px;
	padding: 4px 0;
	border: 0;
	background: transparent;
	font-size: 13px;
	font-weight: 650;
	text-align: left;
	cursor: pointer;
}

.cp-rich {
	padding: 4px 0 6px 18px;
	font-size: 13.5px;
	line-height: 1.65;
	overflow-wrap: anywhere;
}

.cp-rich :deep(*) {
	max-width: 100%;
}

.cp-rich :deep(:where(p, span, div, li, ul, ol, strong, em, b, i, h1, h2, h3, h4, h5, h6, td, th)) {
	color: inherit !important;
	background-color: transparent !important;
}

.cp-rich :deep(p) {
	margin: 0 0 0.6em;
}

.cp-rich :deep(p:last-child) {
	margin-bottom: 0;
}

.cp-rich :deep(ul),
.cp-rich :deep(ol) {
	margin: 0.4em 0;
	padding-left: 1.4em;
}

.cp-rich :deep(a) {
	color: var(--cp-blue);
}

.cp-rich :deep(img) {
	height: auto;
}

.cp-rich :deep(table) {
	display: block;
	overflow-x: auto;
	border-collapse: collapse;
}

.cp-rich :deep(td),
.cp-rich :deep(th) {
	padding: 4px 8px;
	border: 1px solid var(--cp-border);
}

.cp-rich :deep(pre) {
	margin: 0.5em 0;
	padding: 8px 12px;
	overflow-x: auto;
	border: 0;
	border-left: 2px solid var(--cp-border);
	border-radius: 0;
	background: transparent;
	color: inherit;
	font-family: var(--cp-mono);
	font-size: 12.5px;
	white-space: pre-wrap;
}

.cp-rich :deep(code) {
	padding: 1px 5px;
	border: 1px solid var(--cp-border);
	border-radius: 5px;
	background: var(--cp-head-bg);
	color: inherit;
	font-family: var(--cp-mono);
	font-size: 0.92em;
}

.cp-rich :deep(pre code) {
	padding: 0;
	border: 0;
	background: transparent;
}

.cp-workspace {
	display: grid;
	gap: 10px;
	padding: 12px;
	border-top: 1px solid var(--cp-border);
}

.cp-card {
	min-width: 0;
	overflow: hidden;
	border: 1px solid var(--cp-border);
	border-radius: 8px;
	background: var(--cp-bg);
}

.cp-toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 7px 10px;
	border-bottom: 1px solid var(--cp-border);
	background: var(--cp-head-bg);
}

.cp-toolbar-group {
	display: flex;
	align-items: center;
	gap: 6px;
}

.cp-lang {
	position: relative;
	display: inline-flex;
	height: 30px;
	align-items: center;
	border: 1px solid var(--cp-border);
	border-radius: 6px;
	background: var(--cp-bg);
}

.cp-lang:hover {
	background: var(--cp-hover);
}

.cp-lang:focus-within {
	outline: 2px solid var(--cp-focus);
	outline-offset: 1px;
}

.cp-lang select {
	height: 100%;
	padding: 0 26px 0 10px;
	border: 0;
	outline: none;
	appearance: none;
	background: transparent;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
}

.cp-lang select:disabled {
	cursor: wait;
	opacity: 0.6;
}

.cp-lang select option {
	background: var(--cp-option-bg);
	color: var(--cp-option-fg);
}

.cp-lang-chevron {
	position: absolute;
	right: 8px;
	width: 13px;
	height: 13px;
	color: var(--cp-muted);
	pointer-events: none;
}

.cp-icon-btn {
	display: inline-flex;
	width: 30px;
	height: 30px;
	align-items: center;
	justify-content: center;
	border: 1px solid transparent;
	border-radius: 6px;
	background: transparent;
	color: var(--cp-muted);
	cursor: pointer;
}

.cp-icon-btn svg {
	width: 15px;
	height: 15px;
}

.cp-icon-btn:hover:not(:disabled) {
	background: var(--cp-hover);
	color: inherit;
}

.cp-icon-btn:disabled {
	cursor: not-allowed;
	opacity: 0.5;
}

.cp-btn {
	display: inline-flex;
	height: 30px;
	align-items: center;
	gap: 6px;
	padding: 0 13px;
	border: 1px solid transparent;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease,
		transform 0.05s ease;
}

.cp-btn:active:not(:disabled) {
	transform: translateY(1px);
}

.cp-btn:disabled {
	cursor: not-allowed;
	opacity: 0.55;
}

.cp-btn-icon {
	width: 13px;
	height: 13px;
	flex-shrink: 0;
}

.cp-run {
	border-color: var(--cp-border);
	background: var(--cp-bg);
}

.cp-run:hover:not(:disabled) {
	background: var(--cp-hover);
}

.cp-submit {
	border-color: #1c7a43;
	background: #1e8e4d;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
	color: #fff;
}

.cp-submit:hover:not(:disabled) {
	background: #24a45a;
}

.cp-submit:active:not(:disabled) {
	background: #1b7d44;
	box-shadow: none;
}

.cp-spinner {
	display: inline-block;
	width: 12px;
	height: 12px;
	flex-shrink: 0;
	border: 2px solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	opacity: 0.75;
	animation: cp-spin 0.7s linear infinite;
}

@keyframes cp-spin {
	to {
		transform: rotate(360deg);
	}
}

.cp-editor-area {
	height: clamp(240px, 42vh, 420px);
	min-height: 180px;
	max-height: 80vh;
	overflow: hidden;
	resize: vertical;
}

.cp-terminal {
	color: inherit;
}

.cp-terminal-header {
	display: flex;
	height: 42px;
	align-items: center;
	justify-content: space-between;
	padding: 0 12px;
	border-bottom: 1px solid var(--cp-border);
	background: var(--cp-head-bg);
}

.cp-result-tabs {
	display: flex;
	height: 100%;
	align-items: stretch;
	gap: 18px;
}

.cp-result-tabs > button {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0;
	border: 0;
	background: transparent;
	color: var(--cp-muted);
	font-size: 12px;
	cursor: pointer;
}

.cp-result-tabs > button + button {
	position: relative;
}

.cp-result-tabs > button + button::before {
	position: absolute;
	top: 50%;
	left: -10px;
	width: 1px;
	height: 18px;
	background: var(--cp-hover);
	content: "";
	transform: translateY(-50%);
}

.cp-result-tabs .is-active {
	color: inherit;
}

.cp-terminal-header > button {
	border: 0;
	background: transparent;
	color: var(--cp-muted);
	font-size: 11px;
	cursor: pointer;
}

.cp-terminal-header > button:hover {
	color: inherit;
}

.cp-green {
	color: var(--cp-green);
}

.cp-terminal-body {
	position: relative;
	max-height: 380px;
	min-height: 120px;
	overflow: auto;
	padding: 14px 16px;
	font-family: var(--cp-mono);
	font-size: 12px;
	overscroll-behavior: contain;
}

.cp-terminal-body pre {
	margin: 0;
	background: transparent;
	color: inherit;
	font-family: inherit;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.cp-muted {
	color: var(--cp-muted);
}

.cp-empty-result {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	color: var(--cp-muted);
	font-family: inherit;
}

.cp-testcase {
	display: flex;
	min-height: 100%;
	flex-direction: column;
	gap: 10px;
}

.cp-testcase label {
	margin: 0;
	color: inherit;
	font-size: 11px;
	font-weight: 600;
}

.cp-testcase textarea {
	width: 100%;
	min-height: 105px;
	padding: 12px;
	resize: vertical;
	border: 1px solid var(--cp-border);
	border-radius: 7px;
	outline: none;
	background: var(--cp-head-bg);
	font: inherit;
}

.cp-testcase textarea:focus {
	border-color: #4b8bf5;
}

.cp-case-tabs {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-bottom: 6px;
}

.cp-case-tabs button {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	height: 34px;
	padding: 0 14px;
	border: 0;
	border-radius: 7px;
	background: transparent;
	color: var(--cp-muted);
	font-size: 12px;
	cursor: pointer;
}

.cp-case-tabs button:hover {
	background: var(--cp-head-bg);
	color: inherit;
}

.cp-case-tabs button.is-active {
	background: var(--cp-hover);
	color: inherit;
}

.cp-case-tabs .cp-add-case {
	padding: 0 11px;
	color: var(--cp-muted);
	font-size: 20px;
}

.cp-result-cases {
	margin-bottom: 16px;
}

.cp-case-pass {
	color: var(--cp-green);
	font-size: 9px;
}

.cp-case-fail {
	color: var(--cp-red);
	font-size: 9px;
}

.cp-results {
	font-family: inherit;
}

.cp-result-summary {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 6px 14px;
	margin-bottom: 18px;
}

.cp-result-summary strong {
	color: var(--cp-red);
	font-size: 20px;
	font-weight: 500;
}

.cp-result-summary strong.is-success {
	color: var(--cp-green);
}

.cp-result-summary strong.is-pending {
	color: var(--cp-muted);
}

.cp-result-summary span {
	color: var(--cp-muted);
}

.cp-xp-line {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 12px;
	margin: -8px 0 16px;
	color: var(--cp-muted);
	font-size: 12px;
}

.cp-xp-line strong {
	color: var(--cp-orange);
	font-size: 14px;
	font-weight: 700;
}

.cp-xp-line.is-error {
	color: var(--cp-orange);
}

.cp-complexity-info {
	display: flex;
	flex-wrap: wrap;
	gap: 10px 24px;
	margin-bottom: 18px;
	padding: 10px 14px;
	border: 1px solid var(--cp-border);
	border-radius: 7px;
	background: var(--cp-head-bg);
}

.cp-complexity-row {
	display: flex;
	align-items: baseline;
	gap: 8px;
	font-size: 12px;
}

.cp-complexity-row label {
	margin: 0;
	color: var(--cp-muted);
	font-weight: 600;
}

.cp-complexity-row > span {
	color: inherit;
}

.cp-complexity-value {
	font-family: var(--cp-mono);
	font-weight: 600;
}

.cp-complexity-result {
	display: inline-flex;
	align-items: center;
	gap: 3px;
	margin-left: 6px;
	font-weight: 500;
}

.cp-complexity-icon {
	font-size: 0.95em;
	line-height: 1;
}

.cp-complexity-value.optimal,
.cp-complexity-result.optimal {
	color: var(--cp-optimal);
}

.cp-complexity-value.too-complex,
.cp-complexity-result.too-complex {
	color: var(--cp-too-complex);
	font-weight: 600;
}

.cp-complexity-result.unknown .cp-complexity-icon {
	display: none;
}

.cp-result-details {
	display: grid;
	gap: 8px;
}

.cp-result-details label {
	margin: 4px 0 0;
	color: var(--cp-muted);
	font-size: 11px;
}

.cp-result-details pre {
	min-height: 54px;
	padding: 12px;
	border-radius: 7px;
	background: var(--cp-head-bg);
	color: inherit;
}

.cp-result-details pre.is-error {
	color: var(--cp-red);
}

@container (max-width: 520px) {
	.cp-header {
		padding: 10px 12px;
	}

	.cp-problem {
		padding-right: 12px;
		padding-left: 12px;
	}

	.cp-workspace {
		padding: 8px;
	}

	.cp-rich {
		padding-left: 4px;
	}

	.cp-toolbar {
		padding: 6px 8px;
	}

	.cp-btn {
		padding: 0 10px;
	}

	.cp-result-summary strong {
		font-size: 16px;
	}

	.cp-complexity-info {
		flex-direction: column;
		gap: 8px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.cp-skeleton span,
	.cp-spinner {
		animation-duration: 2s;
	}

	.cp-chevron,
	.cp-btn {
		transition: none;
	}
}
</style>