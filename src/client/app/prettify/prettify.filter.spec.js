'use strict';

describe('Filter: prettify', function () {

  // load the filter's module
  beforeEach(module('sqlvizApp'));

  // initialize a new instance of the filter before each test
  var prettify;
  beforeEach(inject(function ($filter) {
    prettify = $filter('prettify');
  }));

  it('should return the input prefixed with "prettify filter:"', function () {
    var text = 'angularjs';
    expect(prettify(text)).toBe('prettify filter: ' + text);
  });

});
