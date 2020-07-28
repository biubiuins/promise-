
**第一题**

```bash
    setTimeout(()=>{
        console.log(1);
    },0)
    Promise.resolve().then(()=>{
        console.log(2);
    })
    Promise.resolve().then(()=>{
        console.log(3);
    })
    console.log(4);
    /*
    输出：4 2 3 1
     */
```

**第二题**

```
    setTimeout(() => {
        console.log(1);
    }, 0)
    //Promise为构造函数
    new Promise(resolve => {
        console.log(2); //同步执行
        resolve()//成功
    }).then(() => { //成功的回调
        console.log(3);
    }).then(() => {//此处的then等上一个执行完之后再放入微队列执行
        console.log(4);
    })
    console.log(5);//同步执行
    /*
    输出:2 5 3 4 1
     */
```

**注意：** 链式的then要等前一个then执行完毕才知道状态，才可以执行。

**第三题**

```bash
  //定义了一个返回promise的函数
     const first = () => (new Promise((resolve, reject) => {
          console.log(1);  //同步执行1
          //返回promise的函数
          let p = new Promise((resolve, reject) => {
              console.log(2); //同步执行2
              //放入宏队列1
              setTimeout(() => {
                  console.log(3);
                  resolve(4) //最后执行宏队列时状态已经修改，不再是等待，所以该行代码不执行
              }, 0)
              resolve(5) //立刻执行，p的状态立刻成功
          })
          resolve(6) //first的状态变成成功
          //成功的回调放入微队列1
          p.then((arg) => {
              console.log(arg);
          })
      }))
      //成功的回调放入为微队列2
      first().then((arg)=>{
          console.log(arg);
      })
      console.log(7);//同步执行3
      /*输出
      1 2 7 5 6 3
      开始：输出 1 2 7
      宏[3]
      微[5 6]
      输出微队列：5 6
      输出宏队列：3
       */
```

**第四题**


```
    //加入宏队列1
    setTimeout(()=>{
        console.log(0);
    },0)
    new Promise((resolve,reject) =>{
        console.log(1); //同步执行1
        resolve()
        //成功的回调加入微队列1
    }).then(()=>{
        console.log(2);
        new Promise((resolve, reject) => {
            console.log(3);
            resolve()
            //成功的回调加入微队列3
        }).then(()=>{
            console.log(4);
            //成功的回调加入微队列5
        }).then(()=>{
            console.log(5);
        })
        //成功的回调加入微队列4
    }).then(()=>{
        console.log(6);
    })
    new Promise((resolve, reject) => {
        console.log(7); // 同步执行2
        resolve()
        //成功的回调加入微队列2
    }).then(()=>{
        console.log(8);
    })
    /*
    输出：1 7 2 3 8 4 6 5 0
    状态1：同步执行输出1 7 宏[0]  微[2 8]
    状态2,执行微任务1（整个then）：输出2 3 宏[0]  微[8 4 6]
    状态3,执行微任务2：输出 8 宏[0]  微[4 6]
    状态4,执行微任务3：输出4 宏[0]  微[6 5]
    ....
    */
```

这道题我错在6和5的顺序上面，不太懂为什么6在5前面。阅读了[一篇文章](https://www.jianshu.com/p/aa3d8b3adde3)之后才明白，下面是对知识点进行摘录+总结。


**知识点1**

当执行 then 方法时，如果前面的 promise 已经是 resolved 状态，则直接将回调放入微队列中。

注意：then方法是同步执行的，但是then中的回调是异步执行的。

在同步执行then方法时，会进行判断：

- 如果前面的 promise 已经是 resolved 状态，则会立即将回调推入微队列
- 如果前面的 promise 是 pending 状态则会将回调存储在 promise 的内部(不会被执行，也不会被放入微队列中)，一直等到 promise 被 resolve 才将回调推入微队列

**知识点2**

resolve的作用除了将当前的 promise 由 pending 变为 resolved，还会遍历之前通过 then 给这个 promise 注册的所有回调，将它们依次放入微队列中，很多人以为是由 then 方法来触发它保存回调，而事实上是由 promise 的 resolve 来触发的，then 方法只负责注册回调。

对于 then 方法返回的 promise 它是没有 resolve 函数的，取而代之只要 then 中回调的代码执行完毕并获得同步返回值，这个 then 返回的 promise 就算被 resolve


```
 new Promise((resolve,reject) =>{
   console.log(1);
   resolve()
//第一个then
 }.then(()=>{
   ...
 //第二个then
 }).then(()=>{
 ...
 })
```

首先Promise是实例化，同步执行函数，打印1，执行resolve函数，将 promise 变为 resolved，但由于此时 then 方法还未执行。由知识点2：resolve会触发保存它的回调。then是同步的，所以会依次保存第一个then和第二个then

[主]外部第一个 then，外部第二个 then [微] 空

然后执行第一then,由于前面的promise已经被resolve了，所以将第一then的回调放入微队列。

[主]外部第二个 then  [微]外部第一个 then的回调

但是这个回调还没有执行，所以第一then返回的promise 仍为 pending 状态，所以同步执行第二个then。由于前面的 promise 是 pending 状态，所以外2then 的回调也不会被推入微任务队列也不会执行

[主]空  [微]外一 then的回调

现在主线程空了，执行微任务，也就外一 then的回调，首先打印出2，随后实例化内部promise，打印3，执行resolve函数
,遍历then保存。

```
 new Promise((resolve,reject) =>{
 ....
 //外1
  }.then(()=>{
   console.log(2);
   new Promise((resolve, reject) =>{
   console.log(3);
    resolve()
   }.then(()=>{
   //内部第一个then
     console.log(4);
   }).then(()=>{
   //内部第二个then
    console.log(5);
   })
  }
  //外2
  .then(()=>{
  .....
  })
```

[主]内1 then 内2的then  [微]空

然后执行内1的then，由于前面的 promise 已被 resolve，所以将回调放入微任务队列中。

[主]内2的then  [微]内1then的回调

然后执行内2的then，因为内部第一个then的回调还未执行所以状态为pending，所以内2then 的回调和外2then 的回调一样，不注册不执行。

[主]空  [微]内1then的回调

**外1的回调全部执行完毕**，这里尤其注意:内2then的回调没执行，但是内2then是执行了的。
外1then 返回的 promise 的状态由 pending 变为 resolved，同时遍历之前通过 then 给这个 promise 注册的所有回调，将它们的回调放入微任务队列中。

[主]空  [微]内1then的回调 外2then 的回调

主线程执行完毕，取出内1then的回调执行

[主]内1then的回调  [微]外2then 的回调

打印4，内1then返回的promise状态由 pending 变为 resolved，同时遍历之前通过 then 给这个 promise 注册的所有回调，将它们的回调放入微任务队列中。

[主] 空 [微]外2then 的回调 内2的回调