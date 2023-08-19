var width, height;

var nodes = [];
var tagTable = [];

var svg, g, node, text, link, img, subtitle, infoHeadline, infoSymbol, infoText, infoRefs, legendText, legendSymbol, legendDiv;
var liveLinks = [];
var liveNodes = [];
var liveTopics = [];
var liveFirsts = [];

var radius = 20;
var symWidth = radius;
var symHeight = radius;

var dataset;
var liveData = [];
var simulation;

var maxStrength = 0.25;
//hacky way to get the vis started well
var whichNum= 0;



const makeRequest = async () => {
  try {
    dataset = await d3.json('cacb-data/sep6.json');
    console.log(dataset)
    return dataset;
  } catch (err) {
    console.log(err)
    throw Error('Failed to load data')
  }
}

var filter;
var topicNodes = [];
var locs = [];
var maxLoc;
const getNodes = async(dataset)=>{
    for (var i = 0; i<dataset.nodes.length; i++){
        nodes.push(dataset.nodes[i])
        if(dataset.nodes[i].first==1){ //if take this off, everything is connected
            topicNodes.push(dataset.nodes[i]) //it looks cool when they are all topic nodes
        }
    }

    for (var i = 0; i<dataset.tags.length; i++){
        tagTable.push(dataset.tags[i]);
        locs.push(dataset.tags[i].loc);
    }
    locs.sort(d3.ascending);
    return nodes;
}


var yScale = d3.scaleLinear()
var poScale = d3.scaleLinear()
var xScale = d3.scaleLinear()
var strokeScale = d3.scaleLinear()
var dashScale = d3.scaleLinear()
var symSize = d3.scaleLinear()
const processPrep = async(dataset, nodes) => {
    //2480 by 1417
    width = window.innerWidth*.99;
    height = window.innerHeight*.99;

    maxLoc = d3.max(locs);

    symSize
        .domain([0, maxLoc])
        .range([symWidth*5, symWidth/5])
    yScale
        .domain(locs)
        .range([-290,-210])
    
    poScale
        .domain([0, maxLoc])
        .range([-100,100])

    xScale
        .domain([0,34])
        .range([-width/3,width/2])

    strokeScale
        .domain([0, maxLoc])
        .range([1, 10])
    dashScale
        .domain([0, maxLoc])
        .range([10, 1])

    simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id)//.strength(0.01)
            .distance(2).strength(0.3))
        .force('center', d3.forceCenter(0,0))
        .force('charge', d3.forceManyBody(-100).strength(0))
        .force('collide', d3.forceCollide().radius(symWidth).strength(0))

    svg = d3.select('body').append('svg')
        .attr('viewBox', [-width/2,-height/2, width, height]);
    legendG = svg.append("g").attr("class","legendG")
        // .attr('transform', 'translate('+-width/5+','+-height*2+'')

    subtitle = svg
        .append("foreignObject")
            .attr("width", 500)
            .attr("height", 280)
            .attr("x", width/5)
            .attr("y", -height/2+100)
            .append("xhtml:div")
        .attr("class","subtitle")
        .style("color","none")
        .html(whichNum);
    infoSymbol = svg
        .append("image")
        .style('filter','brightness(0) invert(1)')
        .attr("class","infoSymbol")
        .attr("x", width/4)
        .attr("y", 100)
    infoHeadline = svg
        .append("foreignObject")
            .attr("width", 100)
            .attr("height", 100)
            .attr("x", width/4+60)
            .attr("y", 100)
            .append("xhtml:div")
        .attr("class","infoHeadline")
        .style("color","none")
        .html(whichNum);
    infoText = svg
        .append("foreignObject")
            .attr("width", 100)
            .attr("height", 100)
            .attr("x", width/4+60)
            .attr("y", 150)
            .append("xhtml:div")
        .attr("class","infoText")
        .style("color","none")
        .html(whichNum);
    infoRefs = svg
        .append("foreignObject")
            .attr("width", 100)
            .attr("height", 100)
            .attr("x", width/4+60)
            .attr("y", 250)
            .append("xhtml:div")
        .attr("class","infoRefs")
        .style("color","none")
        .html(whichNum);

    img = svg.append('g')
        .selectAll('image');

    node = svg.append('g')
        .selectAll('circle');
    text = svg.append('g')
        .selectAll('text');
    link = svg.append('g')
        .selectAll('line');

    document.onkeydown = checkKey;
    function checkKey(e) {
        e = e || window.event;
        if (e.keyCode == '39') {
           // right arrow
           series();
        }
    }
    return svg;
}

function zoomed({ transform }) {
    svg.attr('transform', transform)
}



function series(){
    whichNum++;

    subtitle.exit().remove();
    infoText.exit().remove();
    infoHeadline.exit().remove();
    infoSymbol.exit().remove();

    addText(whichNum);

    chooseData(whichNum)
        .then(liveNodes => linkUp(liveNodes, liveTopics))
        .then(liveLinks => restart(liveLinks, liveNodes, liveFirsts, whichNum))
}

var subtitleText = 
["one low cloud hangs above us,", "a co2 particle turns into many and the low cloud disappears -", "a high cloud forming instead", "and the sun’s radiance pours through", "a tipping point tips", "and energy swarms to cool", "the servers that heat", "the cooling makes co2", "and low clouds disappear", "and high clouds form instead", "the sun sends radiance through", "tipping points tip, permafrost thaws,", "releasing co2", "low clouds disappear", "high clouds form instead", "and the sun’s radiance shines through", "tipping points tip, the ice melts, the seas rise", "and now the sending signals degrade, as the seas rise around the internet landing sites", "and now the wind is here", "and the radio towers bend", "and the humidity swarms around the signals","changing their form", "the sensors seek to sense", "","but the processors misinterpret, misstep","signals drop between the droplets", "what is the weather tomorrow", "as the co2 releases", "and the radiance shines through", "and the high clouds form", "and the radiance shines through", "and the signals degrade as the seas rise and the humidity particles form", "and the loop plays over time", "as each element changes over time", "everything is connected"]

function addText(whichNum){
    subtitle
        .style("color","white")
        .html(subtitleText[whichNum-1])
}

var isNew = [];
var add = false;
function prepLegend(liveFirsts, whichNum){
    isNew.push(liveFirsts.length-1);
    var elNum = liveFirsts.length-1;


    for(var i = 0; i<isNew.length; i++){
        if(isNew[i-1]==elNum){
            add = false;
        }else{
            add = true;
        }
    }
    if(add){
        addToLegend(elNum, liveFirsts[elNum].symb)
    }else{}
}
function addToLegend(elNum, thisSymb){

    console.log(elNum)
    //HAVE TO FIGURE OUT HOW TO SPACE THE LEGEND OUT NICELY, PROGRAMMATICALLY
    legendText = legendG
        .append("foreignObject")
            .attr("width", 100)
            .attr("height", 100)
            .attr("x", function(){
                if(elNum<3){ 
                    return width/4+60
                }if(elNum>=3&&elNum<8){
                    return width/4+160
                }if(elNum>=8&&elNum<14){
                    return width/4+260
                }
            })
            .attr("y", function(){
                if(elNum<3){ 
                    return -height/4+whichNum*5
                }if(elNum>=3&&elNum<8){
                    return -height/4+whichNum*5
                }if(elNum>=8&&elNum<14){
                    return width/4+260
                }
            })
            .append("xhtml")
        .attr("class","legendText")
        .style("color","white")
        .html(names[elNum])

    legendSymbol = legendG
        .append("image")
        .style('filter','brightness(0) invert(1)')
        .attr("class","legendSymbol")
        .attr("x", width/4)
        .attr("y", -height/4+whichNum*5)
        .attr('xlink:href', thisSymb+'/'+1+'.png')
        .attr('transform','translate('+ 0 +','+ -infoSymHeight/2 +')')
        .attr('width', function(){
            if((thisSymb=='symb/CO2') || (thisSymb=='symb/energy')|| (thisSymb=='symb/humidity')){
                return (infoSymWidth-4) + 'px';
            }else{
                return infoSymWidth+'px'
            }
        })
        .attr('height', function(){
            if((thisSymb=='symb/CO2') || (thisSymb=='symb/energy')|| (thisSymb=='symb/humidity')){
                return (infoSymWidth-4) + 'px';
            }else{
                return infoSymHeight+'px'  
            }
        })
        .attr('opacity', function(){
            if((thisSymb=='symb/CO2') || (thisSymb=='symb/energy')|| (thisSymb=='symb/humidity')){
                return .6;
            }else{
                return 1;//.8;
            }            
        })
        add = false;
}

const chooseData = async(whichNum)=>{
    for (var i = 0; i<topicNodes.length; i++){
        if(topicNodes[i].type == whichNum){  
            liveTopics.push(topicNodes[i])
        }
        if(topicNodes[i].type == whichNum && topicNodes[i].first==1){  
        // if(topicNodes[i].first==1){  
            liveFirsts.push(topicNodes[i])
        }
    }
    for (var i = 0; i<nodes.length; i++){
        if(nodes[i].type == whichNum){  
            liveNodes.push(nodes[i])
        }
    }
    return liveNodes;
}
const linkUp = async(liveNodes, topicNodes)=>{
    for (var i = 0; i<liveNodes.length; i++){
        for(j=0; j<liveNodes[i].tags.length; j++){
            for (k=0; k<liveTopics.length; k++){
                if((liveNodes[i].tags[j]==liveTopics[k].tags) && (liveNodes[i].type == whichNum)){
                // if(liveNodes[i].tags[j]==liveTopics[k].tags){
                    liveLinks.push({
                        'source': liveNodes[i].id,
                        'sourceType': liveNodes[i].type,
                        'target': liveTopics[k].id,
                        'targetType': liveTopics[k].type,
                        'sourceSym': liveNodes[i].symb,
                        'targetSym': liveTopics[k].symb,                        
                        'sourceTags': liveNodes[i].tags,
                        'targetTags': liveTopics[k].tags,  
                        'id':liveNodes[i].id
                    })
                }
             }
        }
    }
    return liveLinks;
}

const opacityScale = d3.scaleLinear()
    .domain([0,100])
    .range([0, 1])
const satScale = d3.scaleLinear()
    .domain([1,10])
    .range([255, 255])
const rad2Scale = d3.scaleLinear()
    .domain([1,10])
    .range([1, 50])

var photoWidth = 100;
var photoSmall = 80;
var fillColor = 'white';
function restart(liveLinks, liveNodes, liveFirsts, whichNum){
    prepLegend(liveFirsts, whichNum)

    var opa = .6;
    var minOpa = .1;
    var maxOpa = .9;
    var minOpaNode = opa;

    node = node
        .data(liveNodes, function(d){
            return d.id;
        })
    node.exit()
        .remove();
    node = node.enter().append('image')
        .attr('class', 'sym')
        .style('filter','brightness(0) invert(1)')
        .attr('xlink:href', function(d){
            var max = d.symbNum;
            var initialRandom = Math.random();
            var multiplied = initialRandom * max;
            var answer = Math.floor(multiplied);
            return d.symb+'/'+answer+'.png';
        })
        .attr('transform','translate('+ -symWidth/2 +','+ -symHeight/2 +')')
        .attr('width', function(d){
            if((d.symb=='symb/CO2') || (d.symb=='symb/energy')|| (d.symb=='symb/humidity')){
                return (symWidth-4) + 'px';
            }else{
                return symWidth+'px'
            }
        })
        .attr('height', function(d){
            if((d.symb=='symb/CO2') || (d.symb=='symb/energy')|| (d.symb=='symb/humidity')){
                return (symWidth-4) + 'px';
            }else{
                return symHeight+'px'  
            }
        })
        .attr('opacity', function(d){
            if((d.symb=='symb/CO2') || (d.symb=='symb/energy')|| (d.symb=='symb/humidity')){
                return .6;
            }else{
                return 1;//.8;
            }            
        })

        .merge(node);
 

    node
        .transition()
        .duration(4000)
        .attr('width', function(d){
            if(whichNum>1 && d.type!=whichNum && d.first!=1 && ((d.symb=='symb/clouds/low') || (d.symb=='symb/comms') || (d.symb=='symb/sensors') || (d.symb =='symb/storage') || (d.symb=='symb/process'))){
                return 0+'px'
            }
            else{
                if((d.symb=='symb/CO2') || (d.symb=='symb/energy')|| (d.symb=='symb/humidity')){
                    return (symWidth-4) + 'px';
                }else{
                    return symWidth+'px'
                }
            }
        })



    link = link
        .data(liveLinks, function(d){
            return d.id;
        })
    link.exit()
        .remove()

    link = link.enter().append('path')
        .attr('class', 'link')
        .attr('stroke',fillColor)
        .attr('stroke-width',.5)
        .attr('stroke-opacity',.7)
        .attr('fill','none')
//add if not animating
        .attr('stroke-dasharray',function(d){
            var adjst;
            if(d.sourceTags.length==1){
                adjst = d.sourceTags-1;
            }else{
                adjst = (d.sourceTags[0])-1;
            }
            return strokeScale(dataset.tags[adjst].loc)+","+dashScale(strokeScale(dataset.tags[adjst].loc))
        })
        .attr('stroke-dashoffset','0')
        .attr('opacity',.8)
        .merge(link);


//only if you are CO2 and other human made things?
    // drawOut()
    function drawOut(){
        //IF YOU ARE DEGRADING, THE LINKS WILL BE WEIRD
        //this is tied to the whichNum in terms of sequence
        //and tied to the symb in terms of topical focus
        link.attr('class',function(d){
            if(d.sourceType==whichNum){
                d3.select(this)
                    .transition()
                    .duration(5000)
                    .attr('stroke-dashoffset','450')
                    .attr('stroke-dasharray','1,450')
                    .on('end',drawIn)
            }else{
                d3.select(this)
                    .attr('stroke-dasharray',function(d){
                        var adjst;
                        if(d.sourceTags.length==1){
                            adjst = d.sourceTags-1;
                        }else{
                            adjst = (d.sourceTags[0])-1;
                        }
                        return strokeScale(dataset.tags[adjst].loc)+","+dashScale(strokeScale(dataset.tags[adjst].loc))
                    })
                    .attr('stroke-dashoffset','0')
            }
        })        
    }

    function drawIn(){
        link.attr('class',function(d){
            if(d.sourceType==whichNum){
                d3.select(this)
                    .transition()
 //maybe duration could have more to do with 
 //the character of the item
                    .duration(6000)
                    .ease(d3.easeCubicInOut,1)
                    .ease(d3.easeElasticOut.amplitude(1).period(2))
                    .attr('stroke-dasharray','1,10')
                    .attr('stroke-dashoffset','0')
                    .on('end',drawOut)
            }else{
                d3.select(this)
                    .attr('stroke-dasharray','1,10')
                    .attr('stroke-dashoffset','0')
            }
        }) 
    }


    img = img
        .data(liveFirsts, function(d){
            return d;
        })
    img.exit()
        .remove();
    img = img.enter()
        .append('svg:image')
        .attr('class','backImg')
        .style('filter',0)
        .attr('xlink:href', function(d) {
                if(d.first==1){
                    return 'img/'+d.id+'.png';
                }else{}
        })
        .attr('height', function(d){
                return d.size +'px'
        })
        .attr('opacity', .8) 
        .on("mouseover", function(event, d){
            if(d.first==1){
                addInfo(d.id, d.symb);
            }
        })
        .merge(img)


    simulation
        .nodes(liveNodes)
        .force('link').links(liveLinks);


    if(whichNum==1){
        //first simulation, nothing happening 
    }

    if(whichNum>1 && whichNum<33){

        simulation
            .force('collide', d3.forceCollide().radius(function(d){
                if(d.first==1){
                    return symWidth*2;
                }
                else{
                    return symWidth;
                }
            }).strength(.8))
            .force('charge', d3.forceManyBody(function(d){
                if(d.symb=='symb/clouds/low'){
                    return -500;
                }else{ 
                    return -100 
                }}).strength(.5))
            .force('y', d3.forceY(function(d){
                if(d.tags.length==1){
                    var adjst = d.tags-1;
                    return yScale(dataset.tags[adjst].loc)
                }else{
                    var adjst = (d.tags[0])-1;
                    return yScale(dataset.tags[adjst].loc)
                }
            }).strength(1)) 
    }
    if(whichNum==34){
        simulation
            .force('collide', d3.forceCollide().radius(function(d){
                if(d.first==1){
                    return symWidth
                }else{
                    return symWidth/2;
                }
            }).strength(.8))
            .force('charge', d3.forceManyBody(function(d){
                if(d.symb=='symb/clouds/low'){
                    return -500;
                }else{
                    return -100;  
                }
            }).strength(.1))
            .force('x', d3.forceX(function(d){
                    return xScale(d.type)
            }).strength(1)) 
            .force('y', d3.forceY().strength(0)) 
    }
    if(whichNum==35){
        simulation
            .force('link', d3.forceLink().id(d => d.id)//.strength(0.01)
                .distance(2).strength(0.3))
            .force('center', d3.forceCenter(0,0))
            .force('charge', d3.forceManyBody(-100).strength(0))
            .force('collide', d3.forceCollide().radius(symWidth).strength(0))
            .force('r', d3.forceRadial(function(d){
                return poScale(d.type) 
            }).strength(1))
            .force('x', d3.forceX().strength(0)) 
            .force('y', d3.forceY().strength(0)) 
    }
    simulation
        .alpha(.05)
        .on('tick', ticked)
        .restart()
}
var names = ["low clouds","CO2","high clouds","radiance","tipping points","energy","storage","communications","wind","humidity","sensors","processors","weather"]
var paragraphs = ["Clouds regulate the earth's climate. Low, thick clouds block the sunlight, reflecting around 20 percent of the sun's radiance. Yet low clouds are impacted by the rising carbon dioxide. Under the RCP 8.5 scenario, carbon dioxide will rise to 1,100 ppm and higher. At 1,200 ppm, low clouds destabilise and break apart, which in turn leads to an increase in heat by 14 deg. f.","Carbon dioxide (CO₂) is a trace gas in the Earth's atmosphere. It is also a greenhouse gas that is produced as a byproduct of human activities, and it is a driver of the earth's climate changes. Carbon dioxide is the primary pollutant responsible for climate change; continued emissions will lead to increasing global warming, reaching 1.5°C in the near term.","Clouds in the upper atmosphere let the sunlight stream through. As carbon dioxide increases and temperature increases, low clouds break apart and shift upward, becoming high clouds. High level clouds make the Earth’s attempt to cool itself more difficult as they emit infrared radiation and thus warm the surface.","At Earth's average distance from the Sun (about 150 million kilometers), the average intensity of solar energy reaching the top of the atmosphere directly facing the Sun is about 1,360 watts per square meter, according to measurements made by the most recent NASA satellite missions. If low thick clouds are present, they can reflect around 20 percent of the sun's radiance away from earth.","Tipping points are thresholds where a tiny change could push a system into a completely new state, creating an irreversible shift to a hotter world. The loss of permafrost is one such tipping point as when carbon-rich soils thaw, they lead to a sudden increase in CO₂ emissions and methane, that would lead to more warming, that would continue the cascade of tipping points.","Internal infrastructure for cooling down servers (with water and air) requires energy. Global data centres use more energy than the UK, and by 2025 they will use more than 20% of our global energy supply. Each cloud server that uses non-green electricity emits 487 kg CO₂ per year. Though installing servers in cold locations can help, those locations are themselves warming as CO₂ is emitted.","Data about clouds is unimaginably massive, as in order to observe clouds around the entire world, satellites need to detect cloud interactions across time and space (small particles to storm clouds). A single data set about clouds contains 200 variables on clouds in 280 km × 280 km every 3 h starting in July 1983. The entire volume of data in NASA's archive will reach 247 PB by 2025.","Scientists rely on systems that communicate remotely, through radio frequencies, and on downloading and transferring information remotely. Yet, increasing winds and extreme weather destroys radio towers, flooding threatens internet cable landing sites, and increased moisture impacts radio frequencies themselves.","The world winds are speeding up: global average wind speed has increased from about 7 mph to about 7.4 mph in less than 10 years. Changes in how much sunlight is absorbed or reflected by the surface of the Earth leads to differential heating, which influences the direction and strength of wind patterns. Strong winds can be destructive of any man-made infrastructure.","Specific humidity, the amount of water vapour in the air has increased – as expected in a warming world, where the air has warmed so it is able to hold more water vapour. Humidity has an impact on signal transmission of satellites as their X-band frequency, which gives better resolution will degrade as a result of increasing moisture in the atmosphere.","Sensors are integral to how scientists monitor and observe the earth. The data that they create is the basis for modelling how our earth's climate will change in the near and far futures. Yet as storms become more frequent and intense, sensors are destroyed, their carriers (such as commercial airplanes) pause, and travel to maintain their sites changes in the face of melting ice and floods.","Centres for future climate modelling, weather forecasts and atmospheric monitoring use supercomputing to perform simulations from large amounts of data collected from weather stations around the world. They require up to 100 petabytes of data to run, using historical data to simulate the possible futures.","We rely on weather forecasts to make everyday decisions, it influences and impacts everything we know. We are experiencing more and more unusual weather, extreme weather relative to preindustrial conditions. Forecasting weather requires billions of data points and an entire complex of functioning data observations over land and air, which in and of itself is impacted by the changing weather."]
var references = ["https://www.nature.com/articles/s41561-019-0310-1","https://www.ipcc.ch/report/ar6/syr/","https://www.mpg.de/789486/F001_Focus_016-023.pdf","https://earthobservatory.nasa.gov/features/EnergyBalance/page2.php","https://e360.yale.edu/features/as-climate-changes-worsens-a-cascade-of-tipping-points-looms","https://www.dtu.dk/english/news/all-news/nyhed?id=68360e44-e0ca-480c-ac4e-7d7fcaf573da","https://www.ncei.noaa.gov/products/international-satellite-cloud-climatology","https://www.mckinsey.com/capabilities/sustainability/our-insights/will-infrastructure-bend-or-break-under-climate-stress","https://www.scientificamerican.com/article/the-worlds-winds-are-speeding-up/","https://www.jhuapl.edu/news/news-releases/230104-climate-change-remote-sensing-impact","https://www.jhuapl.edu/news/news-releases/230104-climate-change-remote-sensing-impact","https://cloud.google.com/blog/products/data-analytics/new-climate-model-data-now-google-public-datasets","https://jamesbridle.com/books/new-dark-age"]
var infoSymWidth = symWidth*2;
var infoSymHeight = symHeight*2;
function addInfo(id, symb){
    infoHeadline
        .style("color","white")
        .text(names[id-1]);

    infoText
        .style("color","white")
        .html(paragraphs[id-1]);

    infoRefs
        .style("color","white")
        .html(references[id-1])

    infoSymbol
        .attr('xlink:href', symb+'/'+1+'.png')
        .attr('transform','translate('+ 0 +','+ -infoSymHeight/2 +')')
        .attr('width', function(){
            if((symb=='symb/CO2') || (symb=='symb/energy')|| (symb=='symb/humidity')){
                return (infoSymWidth-4) + 'px';
            }else{
                return infoSymWidth+'px'
            }
        })
        .attr('height', function(){
            if((symb=='symb/CO2') || (symb=='symb/energy')|| (symb=='symb/humidity')){
                return (infoSymWidth-4) + 'px';
            }else{
                return infoSymHeight+'px'  
            }
        })
        .attr('opacity', function(){
            if((symb=='symb/CO2') || (symb=='symb/energy')|| (symb=='symb/humidity')){
                return .6;
            }else{
                return 1;//.8;
            }            
        })
}

function ticked() {
    img.attr('class', positionNodes);
    node.attr('class', positionNodes);
    link.attr('d', makeLinks);
}

function positionNodes(d) {
    img
        .attr('class', function(d){
            return 'img'
        }) 
        .attr('y', function(d,i) { 
            return d.y-photoWidth/2; 
        })
        .attr('x', function(d) {
            return d.x-photoWidth/2; 
        })

    node
        .attr('class', function(d){
            return 'sym'//d.id
        }) 
        .attr('y', function(d) { 
            return d.y;  
        })
        .attr('x', function(d) {
            return d.x; 
        })
    
}
function makeLinks(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy); //possible to play with this curve?
    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
}

makeRequest()
    .then(dataset => getNodes(dataset))
    .then(nodes => processPrep(dataset, nodes))
