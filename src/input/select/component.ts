import * as Choices from 'choices.js';
import { IAttributes } from 'angular';
import { Callback } from '@ledge/types';
import { InputComponentOptions } from '../options';
import { NgComponentController } from '../../controller';

class SelectController extends NgComponentController {
	public static SinglePlaceholder = '----Select One----';
	public static MultiplePlaceholder = '----Select All That Apply----';
	public static IsMultiple($attrs: IAttributes) {
		return $attrs.hasOwnProperty('multiple') || $attrs.type === 'multiple';
	}
	public static GetPlaceholder($attrs: IAttributes) {
		return this.IsMultiple($attrs) ? this.MultiplePlaceholder : this.SinglePlaceholder;
	}

	public list: any[];
	public showChoices: boolean;
	public choices: Choices;

	private isMultiple: boolean;
	private text: string;
	private value: string;
	private destroyCurrentWatcher: Callback;

	public $postLink() {
		const select = this.$element.getElementsByTagName('select').item(0);
		if (select == null) {
			throw new Error('Unable to find select element (something has gone seriously wrong)');
		}

		this.isMultiple = SelectController.IsMultiple(this.$attrs);
		this.value = this.$attrs.value || 'Value';
		this.text = this.$attrs.text || 'Text';

		this.$scope.$watch(
			_ => this.list,
			_ => this.makeSelectList(select, this.list),
			true,
		);
	}

	public makeSelectList(el: HTMLSelectElement, list: any[]) {
		if (this.choices != null) {
			this.choices.destroy();
			this.destroyCurrentWatcher();
		}

		if (el.getAttribute('ng-options') != null) {
			return;
		}

		if (Array.isArray(list)) {
			this.$timeout().finally(() => {
				this.choices = this.makeChoices(el);
				this.choices.setChoices(list, this.value, this.text);
				this.destroyCurrentWatcher = this.createWatcher();
				this.showChoices = true;

				const input = this.$element.querySelector('input') as HTMLInputElement;
				const ngModelParts = this.$attrs.ngModel.split('.');
				const ngModel = ngModelParts[ngModelParts.length - 1];
				input.setAttribute('aria-label', `${ngModel} list selection`);
			});
		}
	}

	private createWatcher() {
		return this.$scope.$watch(
			_ => this.ngModel,
			(_, prev: number[] = []) => {
				const isReset = _ == null || (this.isMultiple ? _.length === 0 : !_);

				if (this.isMultiple) {
					if (isReset) {
						this.choices.removeActiveItems();
					} else if (prev.filter(x => _.includes(x) === false).length > 0) {
						this.destroyCurrentWatcher();
						this.choices.removeActiveItems();
						this.destroyCurrentWatcher = this.createWatcher();
					}
					this.choices.setValueByChoice(_);
				} else {
					if (isReset) {
						this.choices.setValueByChoice('');
					} else if (this.listHasValue(_)) {
						this.choices.setValueByChoice(_);
					}
				}
			},
		);
	}

	private addItem(event: any) {
		const { value } = event.detail;
		const isMultiple = SelectController.IsMultiple(this.$attrs);
		if (this.ngModel != null && (isMultiple ? this.ngModel.includes(value) : this.ngModel === value)) {
			return;
		}
		this.ngModel = isMultiple ? [value].concat(this.ngModel || []) : value;
		this.$timeout();
	}

	private removeItem(event: any) {
		if (SelectController.IsMultiple(this.$attrs)) {
			if (this.ngModel.length === 0) return;

			const { value } = event.detail;
			this.ngModel = this.ngModel.filter((x: any) => x !== value);
		} else {
			this.ngModel = undefined;
		}
		this.$timeout();
	}

	private makeChoices(el: HTMLSelectElement, isMultiple: boolean = this.isMultiple) {
		const opts: Choices.Options = { removeItemButton: true, itemSelectText: '', addItemText: '' };

		if (isMultiple) {
			opts.placeholderValue = this.$attrs.placeholder || SelectController.GetPlaceholder(this.$attrs);
		}

		const choices = new Choices(el, opts);

		choices.passedElement.addEventListener('addItem', this.addItem.bind(this));
		choices.passedElement.addEventListener('removeItem', this.removeItem.bind(this));

		return choices;
	}

	private listHasValue(val: any) {
		return this.list.find(x => (x[this.value] || x) === val) != null;
	}
}

export const selectList: InputComponentOptions = {
	type: 'input',
	render(h) {
		const input = h.createElement('select', [], [
			['ng-attr-name', '{{id}}_{{$ctrl.uniqueId}}'],
			['ng-attr-id', '{{id}}_{{$ctrl.uniqueId}}'],
			['ng-show', '$ctrl.showChoices === true'],
		]);

		if (SelectController.IsMultiple(this.$attrs)) {
			input.setAttribute('multiple', 'true');
		} else {
			const placeholder = h.createElement('option', [], [['placeholder', 'true']]);
			placeholder.innerText = SelectController.GetPlaceholder(this.$attrs);
			placeholder.value = '';
			input.appendChild(placeholder);
		}

		if (NgComponentController.IsMobile()) {
			const text = this.$attrs.text || 'Text';
			const value = this.$attrs.value || 'Value';
			input.classList.add('form-control');
			input.setAttribute('ng-options', `item.${value} as item.${text} for item in $ctrl.list`);
			input.setAttribute('ng-model', `$ctrl.ngModel`);
			input.removeAttribute('ng-show');
		}

		return input;
	},
	ctrl: SelectController,
	bindings: {
		list: '<',
	},
};
