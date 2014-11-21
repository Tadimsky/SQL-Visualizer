'use strict';

describe('Directive: treeGraph', function () {

  // load the directive's module
  beforeEach(module('sqlvizApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<tree-graph></tree-graph>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the treeGraph directive');
  }));
});