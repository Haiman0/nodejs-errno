var assert = require('assert')
var Domain = require('../../lib/Domain')
var Container = require('../../lib/Container')

describe('Domain',function () {

	describe('constructor', function (){
		it('should throw error when container argument is not instance of Container', function (){
			var d
			try{
				d = new Domain('/a/b/c', {})
			} catch (e){
				if(e.message === 'container argument must be a instance of Container'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'no error')
		})
	})
	
	it('#toString()', function (){
		var d
		d = new Domain('')
		assert(d.toString() === '/')
		d = new Domain('/')
		assert(d.toString() === '/')
		d = new Domain('a')
		assert(d.toString() === '/a')
		d = new Domain('/a/../b')
		assert(d.toString() === '/b')
		d = new Domain('/a/')
		assert(d.toString() === '/a')
	})

	it('#sec()', function (){
		var d
		d = new Domain('/a')

		assert(d.sec('b') instanceof Domain)
		assert(d.sec('b').toString() === '/a/b')
		assert(d.sec('').toString() === '/a')
		assert(d.sec('b/').toString() === '/a/b')

		assert(d.sec('..').toString() === '/')
		assert(d.sec('..').toString() === d.parent().toString())
	})

	it('#link()', function (){
		var d
		d = new Domain('/a')

		assert(d.link('b') instanceof Domain)
		assert(d.link('b').toString() === '/ab')

		d = d.link('.')
		assert(d.link('b1').toString() === '/a.b1')
		assert(d.link('b2').toString() === '/a.b2')

		d = new Domain('/a/b')
		assert(d.sec('/..').toString() === d.parent().toString())
	})

	it('#parent()', function (){
		var d
		d = new Domain('/a/b/c')

		assert(d.parent().toString()=== '/a/b')
		assert(d.parent().parent().toString()=== '/a')
	})

	it('#getLevel()', function (){
		var d

		d = new Domain('/a/b/c')
		assert(d.getLevel() === 3)

		d = new Domain('/')
		assert(d.getLevel() === 1)

		d = new Domain('')
		assert(d.getLevel() === 1)
	})

	it('#getSec()', function (){
		var d

		d = new Domain('/a/b/c')
		assert(d.getSec() === 'c')

		d = new Domain('/')
		assert(d.getSec() === '')
		
		d = new Domain('')
		assert(d.getSec() === '')
	})

	describe('#make()', function (){
		it('should throw error when container is not set', function (){
			var d
			d = new Domain('/a/b/c')
			try{
				d.make()
			} catch (e){
				if(/^container not set.+?$/g.test(e.message)){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'no error')
		})

		it('should without error when set container by #setContainer', function (){
			var d, c
			c = new Container()
			c.def('/a/b/c', null, function (){})

			d = new Domain('/a/b/c')
			d.setContainer(c)
			d.make()
		})

		it('should without error when set container by constructor argument', function (){
			var d, c
			c = new Container()
			c.def('/a/b/c', null, function (){})
			
			d = new Domain('/a/b/c', c)
			d.make()
		})
	})
})