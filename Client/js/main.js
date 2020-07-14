document.addEventListener("DOMContentLoaded",()=>{
    // GlobalVariables
    let id;
    let baseLocalURL = 'http://localhost:8000/youglance'
    let baseCloudURL = 'https://youglance.herokuapp.com/youglance'

    // DOM Elements
    const GlobalOutput = document.getElementById("output");
    const entityOutput = document.getElementById("EntityOutput");
    const tableOutput  = document.getElementById("TableOutput");
    // Regex
    let regexReplace=/(<|>)/gi
    let regexSplit=/(v=| vi\/ | \/v\/ | youtu\.be\/ | \/embed\/)/
    let regexId=/[^0-9a-z\-*_$#!^]/i
    let regexUrlModify=/&.*/g

    const timeConvertor=(seconds)=>{
        let str=""
        let hrs=parseInt(seconds/3600)
        let min_sec=seconds%3600
        let min=parseInt(min_sec/60);
        let sec=min_sec%60
        str=hrs+":"+min+":"+sec.toFixed(2)
        return str
    }

    const getEntities= async (id)=>{
        const res = await fetch(`${baseLocalURL}/get_unique_entities/${id}`)
        const data = await res.json();
        return data
    }

    const displayTableData = (data,tab)=>{
        tableOutput.innerHTML=""
        const ul=document.createElement("ul")
        ul.className="list-group"
        if(data.length==0){
            tableOutput.innerHTML=`
            <span class="text-primary font-weight-bold f-3 text-center">No match found..<br>Try something related to video!!!</br></span>
            `
        }
        data.forEach(ele=>{
            const li=document.createElement("li")
            li.className="list-group-item list-group-item-action"
            li.innerHTML=`
            <div class="row">
                <div class="col-md-1"></div>
                <div class="col-md-10"><span class="font-weight-bold">Text</span>: <span>${ele.text}</span> </div>
                <div class="col-md-1"></div>
            </div> 
            <div class="row">
                <div class="col-md-1"></div>
                <div class="col-sm-5"><span class="font-weight-bold">Start</span>: <span>${timeConvertor(ele.start)}</span> </div>
            
                <div class="col-md-1"></div>
            </div>
            `
            li.addEventListener("click",(e)=>{
                e.preventDefault()
                let time=parseInt(ele.start)
                let baseUrl=tab.url.replace(regexUrlModify,"")
                let newUrl=baseUrl+"&t="+time
                chrome.tabs.update(tab.id,{url:newUrl})
            
    
            })
            ul.appendChild(li)
        })
        tableOutput.appendChild(ul)
        
    }

    const getResponseFromKeyword = async (id,keyWord,tab)=>{
        try{
            const res = await fetch(`${baseLocalURL}/wild_card/${id}/${keyWord}`)
            const data = await res.json();
            displayTableData(data,tab)
        }
        catch(err){
            console.log(err)
        }
        
    }

    


    


    chrome.tabs.query({currentWindow:true,active:true},async(tabs)=>{
        let url = tabs[0].url
        if(url.includes("youtube") || url.includes("youtu.be")){
            // continue
            id = url.replace(regexReplace).split(regexSplit)[2]
            if(id!=undefined)id=id.split(regexId)[0]

            entityOutput.innerHTML=`VideoId : <span class="text-primary font-weight-bold">${id}</span>
            <h4>loading ... </h4>`
            const {unique_ents} = await getEntities(id);
            if(unique_ents){
                let divd = document.createElement("div")
                divd.setAttribute("class","div")
                divd.innerHTML=""
                for(var i=0;i<10;i++){
                    if(unique_ents[i]==undefined)break;
                    // rowDiv.innerHTML=rowDiv.innerHTML+`<div class='col-sm-2  text-dark'>${unique_ents[i]}</div>`
                    const col=document.createElement("div");
                    col.setAttribute("class","mx-3")
                    col.innerHTML=`<h4><kbd>${unique_ents[i]}</kbd></h4>`;
                    col.addEventListener("click",(e)=>{
                        getResponseFromKeyword(id,e.target.innerHTML,tabs[0])
                    })
                    divd.appendChild(col)
                }
                entityOutput.innerHTML=''
                entityOutput.appendChild(divd)
                
                

                

                //getResponseFromKeyword(id,keyWord,tabs[0])


            }

        }

        else{
            document.body.innerHTML = '<h2 class="text-center text-dark mt-5">Site is not Youtube</h2>'
        }
    })


})