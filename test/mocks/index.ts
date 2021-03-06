import { $injector } from './--injector';

export * from './-controller';
export * from './-http';
export * from './-input';
export * from './-logger';
export * from './-modal';
export * from './-renderer';
export * from './-service';

export const $scope = $injector.get('$rootScope').$new();
export const $element = $injector.get('$compile')
	(document.createElement('div'))
	($scope);

export function $invokeTemplate(template: any, $attrs: Partial<angular.IAttributes>) {
	return $injector.invoke(template, { }, { $element, $attrs });
}
