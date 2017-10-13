var assert = require('assert')
var Container = require('../../lib/Container')
var Domain = require('../../lib/Domain')
var path = require('path')
var fs = require('fs')

describe('Container',function () {
	var factory = function (){}
	describe('new', function (){
		var lockFile
		lockFile = path.join(__dirname, 'lockFile')
		it('should throw error when the options.lockFile argument not a absolute path', function (){
			var c = new Container( {lockFile: lockFile} )
			assert(true)

			try{
				c = new Container( {lockFile: 'a'} )
			} catch(e) {
				if(e.message === 'options.lockFile argument must be a absolute path'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'not error')
		})

		it('should throw error when the options.lockFile file was been used', function (){
			var c
			try{
				c = new Container( {lockFile: lockFile})
			} catch(e) {
				if(e.message === 'lockFile was been used'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'not error')
		})
	})

	describe('#def()', function (){
		var c = new Container()
		it('should throw error when the domain argument is not a String', function (){
			c.def('/test', null, factory)
			assert(true)

			function def(d){
				try{
					c.def(d, null, factory)
				} catch(e){
					if(e.message === 'domain argument must be a String'){
						assert(true)
					} else {
						throw e
					}
					return
				}
				assert(false, 'not error')
			}
			def([])
			def(123)
			def({})
			def(false)
		})

		it('should throw error when the domain is repeated', function (){
			c.def('/test/repeated', null, factory)
			assert(true)

			try{
				c.def('/test/repeated', null, factory)
			} catch(e){
				if(e.message === 'error was been defined'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'not error')
		})
	})

	describe('#lock()', function (){
		it('should throw error when the options.lockFile argument not set', function (){
			var c = new Container()
			try{
				c.lock()
			} catch(e){
				if(e.message === 'not set lockFile'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'not error')
		})

		it('should freeze code unchanged  when options.lockFile has been set', function (done){
			var lockFile, renamedLockFile, c, codes;
			codes = {}
			lockFile = path.join(__dirname, 'lockFile.freeze')
			renamedLockFile = path.join(__dirname, 'lockFile.freeze.rename')
			c = new Container( {lockFile: lockFile} )
			codes.a1 = c.def('/a1', null, factory).code
			codes.a2 = c.def('/a2', null, factory).code
			codes.a3 = c.def('/a3', null, factory).code
			codes.a4 = c.def('/a4', null, factory).code
			c.lock( function (err){
				if(err){
					done(err)
					return;
				}

				fs.renameSync(lockFile, renamedLockFile)
				c = new Container( {lockFile: renamedLockFile} )
				
				assert(codes.a2 === c.def('/a2', null, factory).code)
				assert(codes.a4 === c.def('/a4', null, factory).code)
				assert(codes.a1 === c.def('/a1', null, factory).code)
				assert(codes.a3 === c.def('/a3', null, factory).code)

				fs.unlinkSync(renamedLockFile)
				done()
			})
		})
		
	})

	describe('#lockSync()', function (){
		it('should throw error when the options.lockFile argument not set', function (){
			var c = new Container()
			try{
				c.lockSync()
			} catch(e){
				if(e.message === 'not set lockFile'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'not error')
		})

		it('should freeze code unchanged  when options.lockFile has been set', function (){
			var lockFile, renamedLockFile, c, codes;
			codes = {}
			lockFile = path.join(__dirname, 'lockFile2.freeze')
			renamedLockFile = path.join(__dirname, 'lockFile2.freeze.rename')
			c = new Container( {lockFile: lockFile} )
			codes.a1 = c.def('/a1', null, factory).code
			codes.a2 = c.def('/a2', null, factory).code
			codes.a3 = c.def('/a3', null, factory).code
			codes.a4 = c.def('/a4', null, factory).code
			c.lockSync()

			fs.renameSync(lockFile, renamedLockFile)
			c = new Container( {lockFile: renamedLockFile} )
			
			assert(codes.a2 === c.def('/a2', null, factory).code)
			assert(codes.a4 === c.def('/a4', null, factory).code)
			assert(codes.a1 === c.def('/a1', null, factory).code)
			assert(codes.a3 === c.def('/a3', null, factory).code)

			fs.unlinkSync(renamedLockFile)
		})
	})

	describe('#make', function (){
		it('should throw error when domain argument missing', function (){
			var c = new Container()

			try{
				c.make()
			} catch (e){
				if(e.message === 'domain argument is required'){
					assert(true)
				} else {
					throw e
				}
				return
			}
			assert(false, 'no error')
		})

		it('should without error when domain argument is a String', function (){
			var c = new Container()
			c.def('/a', null, function (){})
			c.make('/a')
		})


		it('should without error when domain argument is a instance of Domain', function (){
			var c = new Container()
			c.def('/a', null, function (){})
			c.make(new Domain('/a'))
		})

		it('should throw error when domain argument type is unavailable', function (){
			var c = new Container()
			var make = function (d){
				try{
					c.make(d)
				} catch(e){
					if(e.message !== 'domain argument must be a String or instance of Domain'){
						throw  e
					}
					return
				}
				assert(false, 'no error when type is ' + Object.prototype.toString.call(d).slice(8, -1))
			}

			make([])
			make(123)
			make(true)
		})

		it('should added errno info when factory return a object', function (){
			var c = new Container()
			var e1 = c.def('/e1', null, function (info){
				return new Error('e1 error')
			})

			var err = c.make('/e1')

			assert(err.$errno_domain === '/e1')
			assert(err.$errno_code === e1.code)
		})


		
	})
})