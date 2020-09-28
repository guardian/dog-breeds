import * as d3 from "d3"
import d3tip from 'd3-tip'
import { group } from 'd3-array'
import { interpolateTurbo } from 'd3-scale-chromatic'


export function doggies(dogs, pics) {

	function splitCamel(s) {
		// console.log(s)
		return s.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })
	}

	function cleanName(s) {
		return s.replace(/'/g, "_");
	}

	const dogClades = ["","Wild","Basenji","AsianSpitz","AsianToy","NordicSpitz","Schnauzer","SmallSpitz","ToySpitz","Hungarian","Poodle","AmericanTerrier","AmericanToy","Pinscher","Terrier","NewWorld","Mediterranean","ScentHound","Spaniel","Retriever","PointerSetter","ContinentalHerder","UKRural","Drover","Alpine","EuropeanMastiff"]

	const images = group(pics.sheets.Sheet1, d => d.breed)

	// var generic = ["Levriero Meridionale", "Mastino Abruzzese", "Miniature Xoloitzcuintli", "Cane Paratore","Xigou"]
	// console.log(images)

	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width;
	var container = document.querySelector("#graphicContainer").getBoundingClientRect().width;   

	var winW = window.innerWidth
	var winH = window.innerHeight    
	
	var isMobile = false

	if (winW <= 620) {
		isMobile = true
	}
	var height
	var currentDog

	var scaleVal = 1

	scaleVal = 1260

	if (winW >= winH) {
		height = width * 0.6;
	}

	else {
		height = width * 1.6
		scaleVal = 0.8
	}
	
	var margin = {top: 0, right: 0, bottom: 0, left:0};
	
	var forceStrength,bubblesExist;

	d3.select("#graphicContainer svg").remove()

	var svg = d3.select("#graphicContainer").append("svg")
				.attr("width", width - margin.left - margin.right)
				.attr("height", height - margin.top - margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");

	var defs = svg.append("defs");

	var tooltip = d3.select("#graphicContainer .infoInner")

	var radiusVal = 20

	if (isMobile) {
		radiusVal = 10
	}

	var imgW = radiusVal * 2
	var imgH = radiusVal * 2

	var linkMax = Math.min(winW/2 - (radiusVal *2), 170) 
	var linkMin = Math.min(winW/4 - (radiusVal *2), 70) 

	var extent = d3.extent(dogs.links, d => d.outValue)

	var linkLength = d3.scaleLinear()
		.range([linkMax, linkMin])		
		.domain(extent)		

	// console.log(linkLength.domain())	

	var linkWidth = d3.scaleLinear()
		.range([2,(radiusVal*2) * 0.8])		
		.domain(extent)

	var relatedness = d3.scaleLinear()
		.range([1,100])		
		.domain(extent)

	var turboColours = []

	dogClades.forEach(function(d,i) {
		var pos = i/dogClades.length
		turboColours.push(interpolateTurbo(pos))
	})

	var colors1scale = d3.scaleOrdinal()
		.range(turboColours)
		.domain(dogClades)

	dogs.nodes.forEach(function (dog) {

		defs.append('pattern')
			.attr("id", dog.id)
			.attr("width", 1)
			.attr("height", 1)
			.attr("x", 0)
			.attr("y", 0)
			.append("svg:image")
			.attr("xlink:href", function() {

				// if (generic.includes(dog.breed)) {
				// 	return `<%= path %>/imgs/generic.jpg`
				// }
				// else {
					return `<%= path %>/imgs/${cleanName(dog.breed)}.jpg`
				// }
				
			})
			// .attr("xlink:href", (Math.random() < 0.5 ? "<%= path %>/imgs/bsji.jpg" : "<%= path %>/imgs/bedt.jpg") )
			.attr("width", imgW)
			.attr("height", imgH)
			.attr("y", 0)
			.attr("x", 0)

	})

	dogs.links.forEach(function (dog) {
		dog.pct = Math.round(((dog.outValue / 2410976875) * 100) * 100) / 100 
		dog.time = ""
	})

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var breedSelector = d3.select("#breedSelector");			
	var groupSelector = d3.select("#groupSelector");			

	dogs.nodes.sort(function(a, b) {
		var nameA = a.breed.toUpperCase()
		var nameB = b.breed.toUpperCase()
		if (nameA < nameB) {
		return -1;
		}
		if (nameA > nameB) {
		return 1;
		}

		return 0;
	});

	dogs.nodes.forEach(function (d) {

			breedSelector.append("option")
				.attr("value",d.id)
				.text(d.breed)	
		
	})

	var clades = Object.keys(d3.nest().key(d => d.clade).object(dogs.nodes))

	clades.forEach(function (d) {

			groupSelector.append("option")
				.attr("value",d)
				.text(splitCamel(d))	
		
	})


	var outline = d3.scaleOrdinal()
				.domain([''])
				.range(['#005689','#ad0303','#767676','#767676'])	

	var nodeColors = d3.scaleOrdinal()
					.domain([''])
					.range(['#b51800','#298422','#005689','#aad8f1','#767676','#fc8d62','#66c2a5'])				

	var linkColors = d3.scaleOrdinal()
					.domain([''])
					.range(['#005689','#b82266','#767676','#767676'])				
		


	function makeChart(selectedData, charge=-1000, type='center') {

		d3.select("#statusMessage").remove()

		console.log("making chart")
		console.log("data",selectedData)

		// if (typeof simulation !== 'undefined') {
		// 	simulation.stop();	
		// }
		
		features.selectAll(".links")
			.transition('removelinks')
			.style("opacity",0)
			.remove();

		features.selectAll(".nodes circle")
			.transition('removenodecircles')
			.attr("r",0)
			.remove();

		features.selectAll(".nodes")
			.transition('removenodes')
			.remove();	

		features.selectAll(".nodes text")
			.transition()
			.style("opacity",0)
			.remove();
		
		var totalNodes = selectedData.nodes.length;

		console.log(selectedData.nodes)

		var simulation = d3.forceSimulation(selectedData.nodes)
		      .force("link", d3.forceLink(selectedData.links).id(d => d.id).distance(d => linkLength(d.outValue)))
		      // .force("link", d3.forceLink(selectedData.links).id(d => d.id))
		      .force("charge", d3.forceManyBody().strength(charge))
		     .force("center", d3.forceCenter(width / 2, height / 2))
		     // .force("x", d3.forceX())
      	// 	.force("y", d3.forceY())
		     .force("collide", d3.forceCollide().radius(radiusVal + 2).iterations(2))

		// simulation.nodes(selectedData.nodes);
  // 		simulation.force("link").links(selectedData.links);      

		var drag = simulation => {
		  
		  function dragstarted(d) {
		    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		    d.fx = d.x;
		    d.fy = d.y;
		  }
		  
		  function dragged(d) {
		    d.fx = d3.event.x;
		    d.fy = d3.event.y;
		  }
		  
		  function dragended(d) {
		    if (!d3.event.active) simulation.alphaTarget(0);
		    d.fx = null;
		    d.fy = null;
		  }
		  
		  return d3.drag()
		      .on("start", dragstarted)
		      .on("drag", dragged)
		      .on("end", dragended);
		}      

		var links = features.append("g")
			.attr("stroke", "#bababa")
			.attr("stroke-opacity", 1)
			.selectAll("line")
			.data(selectedData.links)
			.join("line")
			.attr("stroke-width", d => linkWidth(d.outValue))
			.attr("class", "links")
			.on("mouseover.tooltip", makeTooltip())
		  	.on('mouseover.fade', fade2(0.1, 'over'))
		  	.on('mouseout.fade', fade2(1, 'out'))
		  	.on("mouseout.tooltip", resetTooltip())

		var linkCircles = features.selectAll(".linkCircle")
			.data(selectedData.links)
			.enter()
			.append("circle")
			.attr("class", "linkCircle")
			.style("opacity", 0)
			.attr("fill", "#FFF")
			.attr("r",12)
			.attr("stroke", "#bababa")

		var linkText = features.selectAll(".linkText")
			.data(selectedData.links)
			.enter()
			.append("text")
			.attr("class", "label")
			.attr("text-anchor", "middle")
			.attr("dy",4)
			.style("font-size","10px")
			.style("opacity", 0)
			.text(function(d) { return Math.round(relatedness(d.outValue) * 10) / 10 })	



		var nodes = features.append("g")
			.attr("class", "nodes")
		.selectAll("g")
		    .data(selectedData.nodes)
		    .enter().append("g")
		    .attr("id", d => d.id)
		    .style("opacity", 1)
		
		var circles = nodes.append("circle")
			.attr("r", radiusVal)
			.attr("fill", d=> `url(#${d.id}`)
			.attr("stroke-width", 3)
			.attr("title", d => d.breed)
			.attr("stroke", d=> colors1scale(d.clade))
			.on('mouseover.fade', fade(0.1, 'over'))
		  	.on('mouseout.fade', fade(1, 'out'))
			.call(drag(simulation))

		var labels = nodes.append("text")	
			.text(d=> d.breed)
			.attr("class", "label")
			.style("opacity", 0)
			.attr('x', 0)
  			.attr('y', radiusVal + 16)
  			.attr("text-anchor", "middle")

  		if (currentDog) {
		      	d3.select(`#${currentDog} .label`).style("opacity",1)
		}

		 simulation.on("tick", () => {
		    links
		        .attr("x1", function(d) {
		        	return d.source.x
		        })
		        .attr("y1", d => d.source.y)
		        .attr("x2", d => d.target.x)
		        .attr("y2", d => d.target.y);

		 	nodes.attr("transform", function(d) {
		 		var r = radiusVal + 0.5
		 		return "translate(" + (d.x = Math.max(r + 4, Math.min(width - (r + 4), d.x))) + "," + (d.y = Math.max(r + 4, Math.min(height - (r + 4), d.y))) + ")";
	  		})
  	
		 	linkText
		        .attr("x", function(d) {
		            return ((d.source.x + d.target.x)/2);
		        })
		        .attr("y", function(d) {
		            return ((d.source.y + d.target.y)/2);
		        });

		    linkCircles
		        .attr("cx", function(d) {
		            return ((d.source.x + d.target.x)/2);
		        })
		        .attr("cy", function(d) {
		            return ((d.source.y + d.target.y)/2);
		        });    

		  	// linkText.attr("transform", function(d) {
		 		// // var r = radiusVal + 0.5
		 		// return "translate(" + (d.x = Math.min(width, (d.source.x + d.target.x)/2) + "," + (d.y = Math.min(height, (d.source.y + d.target.y)/2)) + ")";
	  		// })


		  });	

		 	function makeTooltip() {

		 		return d => {

				console.log("blah")		 		
		 		var text = `<h3>${d.source.breed} and ${d.target.breed}</h3><br>
							<p>Share ${d.outValue} bps or ${d.pct}%</p>`

		  	// 	tooltip.transition()
					// .duration(200)
				 //   	.style("opacity", .9);

				tooltip.html(text)   	

				// var mouseX = d3.event.pageX
		  //       var mouseY = d3.event.pageY
		  //       var half = width/2;
		  //       var tipHeight = document.querySelector("#tooltip").getBoundingClientRect().height
				// var tipWidth = document.querySelector("#tooltip").getBoundingClientRect().width
		        
		  //       if (mouseX < half) {
		  //           tooltip.style("left", (mouseX + 10 ) + "px");
		  //       }

		  //       else if (mouseX >= half) {
		  //           tooltip.style("left", (mouseX - tipWidth - 10) + "px");
		  //       }

		  //       // tooltip.style("left",mouseX + "px");
		  //       tooltip.style("top",mouseY + "px");

		    	}
		 }

		 function resetTooltip() {
		 	return blah => {
		 		var text = `<h3>Information</h3><br>
							<p>Click a dog or link to see more</p>`

				tooltip.html(text)							
		 	}

		 }


		  const linkedByIndex = {};
		 	selectedData.links.forEach(d => {
		    linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
		  });

		  function isConnected(a, b) {
		    return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
		  }

		  function fade(opacity, action) {

		    return d => {
		      nodes.style('stroke-opacity', function (o) {
		        const thisOpacity = isConnected(d, o) ? 1 : opacity;
		        this.setAttribute('fill-opacity', thisOpacity);
		        return thisOpacity;
		      });

		      links.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));

		      if (action === 'over') {
		      		labels.style('opacity', o => (o.source === d || o.target === d ? 0 : 1));
		      		linkText.style('opacity', o => (o.source === d || o.target === d ? 1 : 0));
		      		linkCircles.style('opacity', o => (o.source === d || o.target === d ? 1 : 0));
		      }
		      
		      else {
		      		labels.style('opacity', 0);
		      		linkText.style('opacity', 0);
		      		linkCircles.style('opacity', 0);
		      }

		     if (currentDog) {
		      	d3.select(`#${currentDog} .label`).style("opacity",1)
				}

		    };
		 }

		 function fade2(opacity, action) {

		    return d => {
		    	nodes.style('stroke-opacity', function (o) {
			        const thisOpacity = (d.source.id === o.id || d.target.id === o.id ? 1 : opacity)
			        this.setAttribute('fill-opacity', thisOpacity);
			        return thisOpacity;
		      	});

		    	links.style('stroke-opacity', o => (o.source.id === d.source.id && o.target.id === d.target.id ? 1 : opacity));

		    	linkText.style('opacity', o => (o.source.id === d.source.id && o.target.id === d.target.id ? 1 : 0));
		      	linkCircles.style('opacity', o => (o.source.id === d.source.id && o.target.id === d.target.id ? 1 : 0));

		    	if (action === 'over') {
		      		labels.style('opacity', o => (o.source === d || o.target === d ? 0 : 1));
		      		
		      	}
		      
		      else {
		      		labels.style('opacity', 0);
		      		linkText.style('opacity', 0);
		      		linkCircles.style('opacity', 0);
		      }

		      if (currentDog) {
		      	d3.select(`#${currentDog} .label`).style("opacity",1)
				}

		    };
		 }


	} // end make chart
	
	// var newData = filterGroup('UKRural');
	
	// makeChart(newData, -60)

	var newData = filterData('GSD');
	console.log(newData)
	makeChart(newData)

	// var dogClone = JSON.parse(JSON.stringify(dogs))

	// makeChart(dogClone)

	function filterData(filterBy) {
		// Clone dogs so we don't modify the orig data with d3 force stuff
		var dogClone = JSON.parse(JSON.stringify(dogs))

		var filteredData = {}
		filteredData.links = dogClone.links.filter(dog => (dog.source == filterBy) | (dog.target == filterBy))
		// console.log(filteredData.links)
		var setNodes = new Set()
		setNodes.add(filterBy)
		filteredData.links.forEach(dog => {
			setNodes.add(dog.target)
			setNodes.add(dog.source)  
		})
		filteredData.nodes = dogClone.nodes.filter(dog => setNodes.has(dog.id))

		return filteredData
	}


	function filterGroup(filterBy) {
		// Clone dogs so we don't modify the orig data with d3 force stuff
		var dogClone = JSON.parse(JSON.stringify(dogs))

		var filteredData = {}

		var cladeNodes = new Set() 

		// get all the nodes from this clade

		dogClone.nodes.filter(dog => dog.clade == filterBy).forEach(dog => cladeNodes.add(dog.id))

		// console.log(cladeNodes)

		filteredData.links = dogClone.links.filter(dog => (cladeNodes.has(dog.source)) | (cladeNodes.has(dog.target)))

		cladeNodes.add(filterBy)

		filteredData.links.forEach(dog => { 
			cladeNodes.add(dog.target)
			cladeNodes.add(dog.source)
		})
		filteredData.nodes = dogClone.nodes.filter(dog => cladeNodes.has(dog.id))

		return filteredData
	}

	breedSelector.on("change", function() {
		radiusVal = 20

		if (isMobile) {
			radiusVal = 10
		}

		console.log("dogs",dogs)
		currentDog = d3.select(this).property('value')
		console.log(d3.select(this).property('value'))
		var newData = filterData(d3.select(this).property('value'));
		console.log("newData",newData)
		makeChart(newData)
	});


	groupSelector.on("change", function() {
		radiusVal = 20

		if (isMobile) {
			radiusVal = 10
		}
		currentDog = undefined
		console.log(d3.select(this).property('value'))
		var newData = filterGroup(d3.select(this).property('value'));
		console.log("newData",newData)
		makeChart(newData, -50)
	});

	function makeKey() {
		d3.select("#chartKey svg").remove()
		var keyWidth = document.querySelector("#chartKey").getBoundingClientRect().width;
		var keyHeight = 60;
		var key = d3.select("#chartKey").append("svg")
				.attr("width", keyWidth)
				.attr("height", keyHeight)
				.attr("id", "keySvg")
				.attr("overflow", "hidden");


		key.append("rect")
			.attr("width", keyWidth * 0.2)
			.attr("height", linkWidth(extent[0]))
			.attr("x",2)
			.attr("y",35)
			.attr("fill", "#bababa")
		console.log(linkWidth(linkMax))

		key.append("rect")
			.attr("width", keyWidth * 0.2)
			.attr("height", linkWidth(extent[1]))
			.attr("x", keyWidth * 0.5)
			.attr("y",20)
			.attr("fill", "#bababa")

		key.append("circle")
			.attr("r", 12)
			.attr("cx", 2 + (keyWidth * 0.2)/2)
			.attr("cy",35 + linkWidth(extent[0])/2)
			.attr("stroke", "#bababa")
			.attr("fill", "#FFF")

		key.append("circle")
			.attr("r", 12)
			.attr("cx", (keyWidth * 0.5) + (keyWidth * 0.2)/2)
			.attr("cy", 20 + linkWidth(extent[1])/2)
			.attr("stroke", "#bababa")
			.attr("fill", "#FFF")	

		key.append("text")
			.attr("x",2)
			.attr("y",12)
			.attr("class", "keyText")
			.text("Least related")

		key.append("text")
			.attr("x",keyWidth * 0.5)
			.attr("y",12)
			.attr("class", "keyText")
			.text("Most related")	

		key.append("text")
			.attr("x",2 + (keyWidth * 0.2)/2)
			.attr("y",35 + linkWidth(extent[0])/2)
			.attr("class", "keyText")
			.attr("dy", 4)
			.attr("text-anchor", "middle")
			.text("1")

		key.append("text")
			.attr("x",(keyWidth * 0.5) + (keyWidth * 0.2)/2)
			.attr("y",20 + linkWidth(extent[1])/2)
			.attr("class", "keyText")
			.attr("dy", 4)
			.attr("text-anchor", "middle")
			.text("100")							

	}

	makeKey()

}
