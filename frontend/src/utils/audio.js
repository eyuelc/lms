import AudioBlock from '@/components/AudioBlock.vue'
import { createApp, h } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import { call } from 'frappe-ui'
import { registerDirectives } from '@/directives'
import translationPlugin from '../translation'

export class Audio {
	constructor({ data, config, readOnly }) {
		this.data = data || {}
		this.config = config || {}
		this.readOnly = readOnly
	}

	static get toolbox() {
		const app = createApp({
			render: () =>
				h(Volume2, {
					size: 18,
					strokeWidth: 1.5,
				}),
		})

		registerDirectives(app)

		const div = document.createElement('div')
		app.mount(div)

		return {
			title: 'Audio',
			icon: div.innerHTML,
		}
	}

	static get isReadOnlySupported() {
		return true
	}

	render() {
		this.wrapper = document.createElement('div')

		if (this.data.audio) {
			this.renderAudio()
		} else if (!this.readOnly) {
			this.renderSelector()
		}

		return this.wrapper
	}

	async renderSelector() {
		this.wrapper.innerHTML = `
			<div class="border rounded-lg p-4">
				<div class="text-sm font-medium mb-2">
					Audio
				</div>

				<select
					class="audio-select w-full border rounded px-3 py-2 bg-transparent"
				>
					<option value="">Loading audio...</option>
				</select>
			</div>
		`

		const select = this.wrapper.querySelector('.audio-select')

		try {
			const result = await call('frappe.client.get_list', {
				doctype: 'Audio',
				fields: JSON.stringify([
					'name',
					'title',
					'audio',
				]),
				order_by: 'title asc',
				limit_page_length: 100,
			})

			console.log('Audio records:', result)

			const audioRecords = Array.isArray(result)
				? result
				: result?.message || []

			select.innerHTML = `
				<option value="">Select audio</option>
			`

			audioRecords.forEach((audio) => {
				const option = document.createElement('option')

				option.value = audio.name
				option.textContent = audio.title || audio.name

				if (audio.name === this.data.audio) {
					option.selected = true
				}

				select.appendChild(option)
			})

			select.addEventListener('change', (event) => {
				this.data.audio = event.target.value
			})
		} catch (error) {
			console.error('Failed to load Audio records:', error)

			select.innerHTML = `
				<option value="">
					Failed to load audio
				</option>
			`
		}
	}

	async renderAudio() {
		try {
			const result = await call('frappe.client.get', {
				doctype: 'Audio',
				name: this.data.audio,
			})

			console.log('Selected Audio:', result)

			const audio = result?.message || result

			if (!audio?.audio) {
				this.wrapper.innerHTML = `
					<div class="text-sm text-gray-500 p-4">
						Audio file not found.
					</div>
				`
				return
			}

			const app = createApp(AudioBlock, {
				file: audio.audio,
			})

			registerDirectives(app)
			app.use(translationPlugin)
			app.mount(this.wrapper)

			this.app = app
		} catch (error) {
			console.error('Failed to load Audio:', error)

			this.wrapper.innerHTML = `
				<div class="text-sm text-red-500 p-4">
					Failed to load audio.
				</div>
			`
		}
	}

	save() {
		return {
			audio: this.data.audio || '',
		}
	}

	validate(savedData) {
		return !!savedData.audio
	}

	destroy() {
		if (this.app) {
			this.app.unmount()
			this.app = null
		}
	}
}