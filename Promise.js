/*
自定义Promise函数模块
 */

//匿名函数自定义（(function)(window)
(function (window) {

  const PENDING="pending"
  const RESOLVED ='resolved'
  const REJECTED ='rejected'


/*
Promise构造函数
excutor：执行器函数（同步执行）
*/
function Promise(excutor){

    //由于函数里面的this是指向window的，所以先保存当前promise对象的this
    const  that = this



    that.status = "PENDING"; //给promise对象指定status属性，初始值为pending
    that.data="undefined";//给promise对象指定一个用于存储结果数据的属性
    that.callbacks=[];//每个元素的结构：{onResolved(){},onRejected(){}}
 function resolve(value){

    //最开始的this指向window，所以用上面指向promise对象的that

 //如果当前状态不是pending，直接结束
  if (that.status!=="PENDING"){
     return
   }
 //将状态改为resolved
     that.status = 'RESOLVED'
 // 保存value数据
     that.data = value;
 //如果有待执行callback函数，立即异步执行回调
 if (that.callbacks.length>0){
   // 要是异步执行,放入队列中执行所有成功的回调
     setTimeout(()=>{
         that.callbacks.forEach(callbackObj=>{
             callbackObj.onResolved(value)
         });
     })

     }
 }


 function reject(reason){
     //如果当前状态不是pending，直接结束
     if (that.status!=="PENDING"){
         return
     }
//将状态改为rejected
     that.status = 'rejected'
// 保存reason数据
     that.data = reason;
 //如果有待执行callback函数，立即异步执行回调
if (that.callbacks.length>0){
         // 要是异步执行,放入队列中执行所有成功的回调
         setTimeout(()=>{
             that.callbacks.forEach(callbackObj=>{
                 callbackObj.onRejected(reason)
             });
         })

     ;
 }
 }
//立即同步执行excutor
try {
    excutor(resolve,reject )
}   catch (error) { //如果执行器抛出异常，promise对象变为rejected状态
    reject(error)
}

}
/*
Promise原型对象的then()
指定成功和失败的回调函数
返回一个新的Promise对象
返回promise的结果由onResolved/onRejected执行结果决定
 */
Promise.prototype.then = function(onResolved,onRejected){
const  that = this
/*
指定回调函数的默认值（必须是函数）
 */
//向后传递成功的value
onResolved = typeof onResolved === 'function' ?  onResolved : value => value
//实现异常传透，指定默认的失败的回调,为什么是throw ，当前没有处理传递下去让别人处理
onRejected = typeof onRejected === 'function' ?  onRejected : reason=>{throw reason}

 //返回一个新的promise对象
return new Promise((resolve,reject)=>{
   /*
   调用指定的回调函数，根据执行的将结果，改变return的promise状态
    */
   function handle(callback) {
        /*
        1.如果抛出异常，return的promise就会失败，reason就是error
        2.如果回调函数返回不是promise，return的promise就会成功，value就是成功的值
        3.如果回调函数返回是promise，return的promise的结果根据这个promise的结果决定
         */
        try{
            const result = callback(that.data);
            if (result instanceof Promise) {
                result.then(
                    value => resolve(value),
                    reason => reject(reason)
                )
            }else{
                //如果回调返回的不是promise,return的promise结果就是这个promise的结果
                resolve(result)
            }
        }catch (error) {
            reject(error)
        }

    }


    if (that.status ==='PENDING'){
        //如果当前状态还是pending,将回调函数保存起来
        that.callbacks.push({
            onResolved(){
                handle(onResolved)
            },onRejected(){
                handle(onRejected)
            }
        })
    }else if(this.status ==='RESOLVED'){
        //如果当前状态是resolve，异步执行onResolve并改变return的promise状态
        setTimeout(()=>{
            handle(onResolved)
        })
    }else {
        //如果当前状态是rejected，异步执行onRejected并改变return的promise咋荒唐
        setTimeout(()=>{
            handle(onRejected)
        })
    }
})
}
/*
Promise原型对象的catch()
指定失败的回调函数
返回一个新的Promise对象
*/
Promise.prototype.catch = function(onRejected){
    //因为this.then返回的是promise，链式不能断所以用return
    return this.then(undefined,onRejected)
}
/*
Promise函数对象resolve方法
返回一个成功的promise，成功的值为value
 */
Promise.resolve = function (value){
//返回一个成功/失败的promise
    return new Promise((resolve,reject)=>{
        // value是promise,使用value的结果作为promise的结构
        if (value instanceof Promise) {
            value.then(
                value => resolve(value),
                reason => reject(reason)
            )
        }else{
            //如果value不是promise
            resolve(value)
        }
    })
}
 /*
 Promise函数对象reject方法
 返回一个失败的promise，失败的值为reason
*/
Promise.reject = function (reason){
    //返回一个promise
 return new Promise((resolve,reject)=>{
     reject(reason)//reason => reject(reason)
 })
}
/*
Promise函数对象all方法
返回一个promise，只有每一个promise都成功时才返回成功的promise
*/
Promise.all = function (promises){

//用来保存所有成功value的数组
const values =new Array(promises.length)
//需要一个计数器来记录成功的次数
let resolvedCount = 0
return new Promise((resolve,reject)=>{
    //遍历promises获取每个promise的结果
    promises.forEach((p,index)=>{
        //若当前的p不是Promise是个数字，则把该数字包装成promise
        Promise.resolve(p).then(
            value => { //p成功，将成功的value保存在values
                resolvedCount++
                //按promises的顺序存放
                values[index] = value
                //如果全部成功，return的promise就成功
                if (resolvedCount === promises.length){
                    resolve(values)
                }
            },
            reason => {
                //只要其中有一个失败了，return的promise就失败
                reject(reason)
            }
        )
    })
})
}
 /*
Promise函数对象race方法
返回一个promise，其结果由第一个完成的promise决定
 */
Promise.race = function (promises){
//返回一个promise
 return new Promise((resolve,reject)=>{
        //遍历promises获取每个promise的结果
        promises.forEach((p,index)=>{
            Promise.resolve(p).then(
                value => { //第一个完成的p为成功，就return变为成功
                    resolve(value)
                },
                reason => {
                    //第一个完成的p为失败，return的promise就失败
                    reject(reason)
                }
            )
        })
    })
}
/*
返回一个promise对象，它在指定的时间后才确定结果
 */
Promise.resolveDelay = function(value,time){
    return new Promise((resolve,reject)=>{
        setTimeout(
            ()=>{
                // value是promise,使用value的结果作为promise的结构
                if (value instanceof Promise) {
                    value.then(
                        value => resolve(value),
                        reason => reject(reason)
                    )
                }else{
                    //如果value不是promise
                    resolve(value)
                }
            },time
        )

    })
}
 /*
 返回一个promise对象，它在指定的时间后才失败
 */
Promise.rejectDelay = function(value,time){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            reject(value)//reason => reject(reason)
        },time)

    })


 }
//向外暴露Promise函数
window.Promise = Promise
})(window)