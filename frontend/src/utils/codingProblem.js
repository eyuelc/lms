import CodingProblemComponent from '@/components/CodingProblem.vue'
import { createApp, h } from 'vue'
import { Code2 } from 'lucide-vue-next'
import { call } from 'frappe-ui'
import { registerDirectives } from '@/directives'
import translationPlugin from '../translation'

export class CodingProblem {
	constructor({ data, config, readOnly }) {
		this.data = data || {}
		this.config = config || {}
		this.readOnly = readOnly
	}

	static get toolbox() {
		const app = createApp({
			render: () =>
				h(Code2, {
					size: 18,
					strokeWidth: 1.5,
				}),
		})

		registerDirectives(app)

		const div = document.createElement('div')
		app.mount(div)

		return {
			title: 'Coding Problem',
			icon: div.innerHTML,
		}
	}

	static get isReadOnlySupported() {
		return true
	}

	render() {
		this.wrapper = document.createElement('div')

		if (this.data.problem) {
			this.renderProblem()
		} else if (!this.readOnly) {
			this.renderSelector()
		}

		return this.wrapper
	}

	renderProblem() {
		const app = createApp(CodingProblemComponent, {
			problem: this.data.problem,
		})

		registerDirectives(app)
		app.use(translationPlugin)
		app.mount(this.wrapper)

		this.app = app
	}

	async renderSelector() {
		this.wrapper.innerHTML = `
			<div class="border rounded-lg p-4">
				<div class="text-sm font-medium mb-2">
					Coding Problem
				</div>

				<select
					class="coding-problem-select w-full border rounded px-3 py-2 bg-transparent"
				>
					<option value="">Loading problems...</option>
				</select>
			</div>
		`

		const select = this.wrapper.querySelector(
			'.coding-problem-select'
		)

		try {
			const result = await call('dsa.api.get_problems')

			console.log('DSA problems:', result)

			const problems = Array.isArray(result)
				? result
				: result?.message || []

			select.innerHTML = `
				<option value="">Select a coding problem</option>
			`

			problems.forEach((problem) => {
				const option = document.createElement('option')

				option.value = problem.route_slug
				option.textContent = `${problem.title} (${problem.route_slug})`

				if (problem.route_slug === this.data.problem) {
					option.selected = true
				}

				select.appendChild(option)
			})

			select.addEventListener('change', (event) => {
				this.data.problem = event.target.value
			})
		} catch (error) {
			console.error('Failed to load DSA problems:', error)

			select.innerHTML = `
				<option value="">Failed to load problems</option>
			`
		}
	}

	save() {
		return {
			problem: this.data.problem || '',
		}
	}

	validate(savedData) {
		return !!savedData.problem
	}

	destroy() {
		if (this.app) {
			this.app.unmount()
			this.app = null
		}
	}
}