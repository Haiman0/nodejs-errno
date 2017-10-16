/**
 * @module err-no
 */
var Container = require('./lib/Container')
var Domain = require('./lib/Domain')

/** 
 * Class of Container
 * @type {Container}
 */
exports.Container = Container

/** 
 * Class of Domain
 * @type {Domain}
 */
exports.Domain = Domain

/**
 * Create an instance of Container.
 * @param  {object} options 
 * @return {Container} -  instance of Container
 */
exports.create = function (options){
	return new Container(options)
}