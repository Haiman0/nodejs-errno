var assert = require('assert')
var errno = require('../')

describe('code正确性',function () {


	describe('层级前缀', function (){

		it('1-17层', function (){
			var eno = errno()
			var parent = ''
			var e
			var factory = function (){}

			for (var i = 1; i <= 17; i++) {
				parent += '/l' + i
				e = eno.def(parent, null, factory)
				assert((e.code + '').split('0')[0].length === i)
			}
			
		})

		it('同层不同domain序号递增: 8层2000个', function (){
			var eno = errno()
			var e
			var factory = function (){}
			var createDomain = function (){
				var domain = ''
				for (var i = 0; i < 8; i++) {
					domain += '/' + parseInt(Math.random() * 100)
				}
				return domain
			}


			for (var i = 1; i <= 2000; i++) {
				e = eno.def(createDomain(), null, factory)
				assert((e.code + '').slice(0, 8).slice(4) === String(i + 1110))
			}
			
		})
	})

	it('10000个不同名1~4层级domain不重复', function (done){
		this.timeout(4000)
		var eno = errno()
		var arr = []
		var tmp
		var factory = function (){}
		for (var i = 1; i < 10000; i++) {
			tmp = '/' + (i + '').split('').join('/')
			e = eno.def(tmp, null, factory)

			assert(arr.indexOf(e.code) === -1)
			arr.push(e.code)
		}
		done()
	})

	
})

