'use strict'


function delete_files (value) {

    console.log('Из текущей директории был удален файл '+ value );
    let va =  document.getElementById(value)
    va.remove();
    $.ajax({
      url: "/delete",   //путь
      type: "GET",    //Метод отправки
      data:{          //передается ключ значение после ?
        id:value
      },
      success: function(){
        window.location.reload()    //если успешно, то перезапускаем страницу через аякс
      }

    });

}

function add_files () {
    let result = document.getElementById ('recipient-name').value ;
    console.log(result)

    let arr = document.getElementById ('recipient-ip').value;
    console.log(arr)

    $.ajax({
      url: "/add",   //путь
      type: "GET",  //Метод отправки
      data:{        //передается ключ значение после ?
        domain: result,
        ip: arr
      },
      success: function(){
        window.location.reload()    //если успешно, то перезапускаем страницу через аякс
      }
    });
}

function superSearch(){
  let searchResult = document.getElementById ('searchInput').value;


  $.ajax({
    url: "/search",   //путь
    type: "GET",  //Метод отправки
    data:{        //передается ключ значение после ?
      search: searchResult,

    },
    success: function(){
      window.location.reload()    //если успешно, то перезапускаем страницу через аякс
    }
  });
}

function loginAsUser(){
  let loginResult = document.getElementById ('inputLogin').value;
  let passwordResult = document.getElementById ('inputPassword').value;

  $.ajax({
    url: "/getLogin",   //путь
    type: "GET",  //Метод отправки
    data:{        //передается ключ значение после ?
      login: loginResult,
      password:passwordResult
    },

    success: function(out){
          if (out.status == 1){
          document.getElementById("idLi").innerHTML=out.user; //вывод html
          document.getElementById("nameLi").innerHTML=out.name;

        }
        else{
          alert("Пользователь не найден")
        }
  }
});
}
