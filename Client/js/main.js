document.addEventListener("DOMContentLoaded", () => {
    // GlobalVariables
    let id;
    let sentimentData;
    let baseLocalURL = 'http://localhost:8000/youglance'
    let baseCloudURL = 'https://youglance.herokuapp.com/youglance'

    // DOM Elements
    const GlobalOutput = document.getElementById("output");
    const home = document.getElementById("home")
    const entityOutput = document.getElementById("EntityOutput");
    const tableOutput = document.getElementById("TableOutput");
    const inputElement = document.getElementById("keyword");
    const graphOutput = document.getElementById("graph-output");
    let barGraph = document.getElementById("bar-graph");
    let donutGraph = document.getElementById("donut-graph");
    const btn = document.getElementById("btn1");
    const showGraph = document.getElementById("btn2");
    const goBack = document.getElementById("btn3");
    const loadingHeader = document.getElementById("loadingHeader")
    const graphDiv = document.getElementById("graphs")
    // Regex
    let regexReplace = /(<|>)/gi
    let regexSplit = /(v=| vi\/ | \/v\/ | youtu\.be\/ | \/embed\/)/
    let regexId = /[^0-9a-z\-*_$#!^]/i
    let regexUrlModify = /&.*/g

    const timeConvertor = (seconds) => {
        let str = ""
        let hrs = parseInt(seconds / 3600)
        let min_sec = seconds % 3600
        let min = parseInt(min_sec / 60);
        let sec = min_sec % 60
        str = hrs + ":" + min + ":" + sec.toFixed(2)
        return str
    }

    const getEntities = async (id) => {
       try{
        const res = await fetch(`${baseLocalURL}/get_unique_entities/${id}`)
        const data = await res.json();
        console.log(data)
        return data
       }
       catch(err){
           console.log(err)
           entityOutput.innerHTML=`<h3 class="text-center">Sorry ,We are unable to fetch insights of this video</h3>
           <h3 class="text-center">Try another video</h3>`
       }
    }

    const getGraphData = async(id)=>{
        try{
        const res  = await fetch(`${baseLocalURL}/sentiment/${id}`)
        const data = await res.json()
        return data
        }
        catch(err){
            console.log(err)
        }
    }

    const displayTableData = (data, tab) => {
        tableOutput.innerHTML = ""
        const ul = document.createElement("ul")
        ul.className = "list-group"
        if (data.length == 0) {
            tableOutput.innerHTML = `
            <span class="text-primary font-weight-bold f-3 text-center">No match found..<br>Try something related to video!!!</br></span>
            `
        }
        data.forEach(ele => {
            const li = document.createElement("li")
            li.className = "list-group-item list-group-item-action"
            li.innerHTML = `
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
            li.addEventListener("click", (e) => {
                e.preventDefault()
                let time = parseInt(ele.start)
                let baseUrl = tab.url.replace(regexUrlModify, "")
                let newUrl = baseUrl + "&t=" + time
                chrome.tabs.update(tab.id, { url: newUrl })
            })
            ul.appendChild(li)
        })
        tableOutput.appendChild(ul)
    }

    const getResponseFromKeyword = async (id, keyWord, tab) => {
        const res = await fetch(`${baseLocalURL}/wild_card/${id}/${keyWord}`)
        const data = await res.json();
        displayTableData(data, tab)
    }

    const getResponseBySubmit = async (id, input, tab) => {
        const query = input.split(" ");
        const dataObject = {
            video_id: id, query: query
        }
        const options = {
            method: "POST",
            body: JSON.stringify(dataObject),
            headers: {
                "Content-Type": "application/json"
            }
        }

        const res = await fetch(`${baseLocalURL}/search_by_ents`, options);
        const data = await res.json();
        displayTableData(data, tab)
    }

    const plotBarGraph = (key,value) => {
        loadingHeader.style.display="none";
        graphDiv.style.display="block"
        var ctx = document.getElementById("bar-chart").getContext('2d');
        let chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: key,
                datasets: [
                    {
                        label: "Count(Frequency)",
                        backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"],
                        data: value
                    }
                ]
            },
            options: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Count of Words/Entities'
                }
            }
        });
    }

    const plotDonutGraph = (key,value) => {
        loadingHeader.style.display="none";
        graphDiv.style.display="block"
        const ctx = document.getElementById("donut-chart").getContext("2d")
        let chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: key,
                datasets: [
                    {
                        label: "Sentiment-count",
                        backgroundColor: ["#e3430e","#48f542","#0ed1e3"],
                        data: value
                    }
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Sentiment Analysis Of Video'
                }
            }
        });

    }

    chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {

        let url = tabs[0].url
        if (url.includes("youtube") || url.includes("youtu.be")) {
            // continue
            id = url.replace(regexReplace).split(regexSplit)[2]
            if (id != undefined) id = id.split(regexId)[0]
            entityOutput.innerHTML = `
            VideoId : <span class="text-primary font-weight-bold">${id}</span>
            <h4>loading ... </h4>
            `
            const { unique_ents } = await getEntities(id);
            console.log("fetch")
            if (unique_ents) {
                btn.disabled = false
                showGraph.disabled = false
                let div = document.createElement("div")
                div.setAttribute("class", "row")
                div.innerHTML = ""
                for (var i = 0; i < 10; i++) {
                    if (unique_ents[i] == undefined) break;
                    const col = document.createElement("div");
                    col.setAttribute("class", "mx-3")
                    col.innerHTML = `<h4><kbd>${unique_ents[i]}</kbd></h4>`;
                    // OnClick Listerner
                    col.addEventListener("click", (e) => {
                        getResponseFromKeyword(id, e.target.innerHTML, tabs[0])
                        tableOutput.innerHTML = `<h2 class="text-center">Loading...</h2>`
                    })
                    div.appendChild(col)
                }

                entityOutput.innerHTML = ''
                entityOutput.appendChild(div)
            }

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const inputValue = inputElement.value;
                if (inputValue == "") {
                    tableOutput.innerHTML = `
                    <span class="text-danger font-weight-bold f-2">Please enter some text to search...</span>
                    `
                }
                else {
                    tableOutput.innerHTML = `<h2 class="text-center">Loading...</h2>`
                    getResponseBySubmit(id, inputValue, tabs[0])
                }
            })

            showGraph.addEventListener("click",async (e) => {
                home.style.display="none";
                graphOutput.style.display="block";
                graphDiv.style.display="none";
                loadingHeader.style.display="block";

                e.preventDefault();
            
                const graphData = await getGraphData(id);
                let sentimentKeyArray=[]
                let sentimentValueArray=[]
                let countKeyArray=[]
                let countValueArray=[]
                if(graphData){
                    let countObject = graphData.label_stats;
                    for(let key in countObject){
                        countKeyArray.push(key);
                        countValueArray.push(countObject[key])
                    }
                    delete graphData.label_stats;
                    for(let key in graphData){
                        sentimentKeyArray.push(key);
                        sentimentValueArray.push(graphData[key])
                    }
                    

                }
                plotDonutGraph(sentimentKeyArray,sentimentValueArray);
                plotBarGraph(countKeyArray,countValueArray);
            })

            goBack.addEventListener("click",(e)=>{
                e.preventDefault();
                graphOutput.style.display="none";
                home.style.display="block";
                loadingHeader.style.display="none";
            })

        }
        else {
            document.body.innerHTML = '<h2 class="text-center text-dark mt-5">Site is not Youtube</h2>'
        }
    })


})