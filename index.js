var Container = require('./lib/Container')
var Domain = require('./lib/Domain')

exports.Container = Container
exports.Domain = Domain

exports.create = function (options){
	return new Container(options)
}