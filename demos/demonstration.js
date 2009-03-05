function switchStretch() {
	var $demo = $('#demonstration');
	// Reset animation queue
	while($demo.queue()[0])
		$demo.dequeue();
	backToOrigin();			
	switch($('#demonstration :selected').attr('value')) {
		case 'stretch':
			$('#imgDemo0').animate({top:'-20px', left:'-20px', width:'20px', height: '20px'});
			$('#imgDemo1').animate({top:'-20px', left:'0px', width:'138px', height: '20px'});
			$('#imgDemo2').animate({top:'-20px', left:'138px', width:'30px', height: '20px'});
			
			$('#imgDemo3').animate({top:'0px', left:'-20px', width:'20px', height: '112px'});
			$('#imgDemo4').animate({top:'0px', left:'0px', width:'138px', height: '112px'});
			$('#imgDemo5').animate({top:'0px', left:'138px', width:'30px', height: '112px'});
			
			$('#imgDemo6').animate({top:'112px', left:'-20px', width:'20px', height: '25px'});
			$('#imgDemo7').animate({top:'112px', left:'0px', width:'138px', height: '25px'});
			$('#imgDemo8').animate({top:'112px', left:'138px', width:'30px', height: '25px'});
			break;
		case 'repeat':
			$demo.queue(function(){
				$('#imgDemo0').animate({top:'-20px', left:'-20px', width:'20px', height: '20px'});
				$('#imgDemo1').animate({top:'-20px', left:'0px', height: '20px'});
				$('#imgDemo2').animate({top:'-20px', left:'138px', width:'30px', height: '20px'});
				
				$('#imgDemo3').animate({top:'0px', left:'-20px', width:'20px'});
				$('#imgDemo4').animate({top:'0px', left:'0px', width:'20px', height: '20px'});
				$('#imgDemo5').animate({top:'0px', left:'138px', width:'30px'});
				
				$('#imgDemo6').animate({top:'112px', left:'-20px', width:'20px', height: '25px'});
				$('#imgDemo7').animate({top:'112px', left:'0px', height: '25px'});
				$('#imgDemo8').animate({top:'112px', left:'138px', width:'30px', height: '25px'}).queue(function(){
					$demo.dequeue();
					$(this).dequeue();
				});
			}).queue(function() {
				var $last;
				for(var i=0; i<6; ++i)
					$last = $('#imgDemo1').clone().prependTo('#container').animate({left: ((i+1)*20)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<3; ++i)
					$last = $('#imgDemo5').clone().prependTo('#container').animate({top: ((i+1)*30)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<5; ++i)
					$last = $('#imgDemo7').clone().prependTo('#container').animate({left: ((i+1)*25)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<5; ++i)
					$last = $('#imgDemo3').clone().prependTo('#container').animate({top: ((i+1)*20)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<42; ++i) {
					$last = $('#imgDemo4').clone().prependTo('#container').animate({left: ((i%7)*20)+'px', top: (Math.floor(i/7)*20)+'px'});
				}										
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			});
			break;
		case 'round':
			$demo.queue(function(){
				$('#imgDemo0').animate({top:'-20px', left:'-20px', width:'20px', height: '20px'});
				$('#imgDemo1').animate({top:'-20px', left:'0px', height: '20px'});
				$('#imgDemo2').animate({top:'-20px', left:'138px', width:'30px', height: '20px'});
				
				$('#imgDemo3').animate({top:'0px', left:'-20px', width:'20px', height: '18.5px'});
				$('#imgDemo4').animate({top:'0px', left:'0px', width:'20px', height: '20px'});
				$('#imgDemo5').animate({top:'0px', left:'138px', width:'30px', height: '28px'});
				
				$('#imgDemo6').animate({top:'112px', left:'-20px', width:'20px', height: '25px'});
				$('#imgDemo7').animate({top:'112px', left:'0px', height: '25px', width: '23px'});
				$('#imgDemo8').animate({top:'112px', left:'138px', width:'30px', height: '25px'}).queue(function(){
					$demo.dequeue();
					$(this).dequeue();
				});
			}).queue(function() {
				var $last;
				for(var i=0; i<6; ++i)
					$last = $('#imgDemo1').clone().prependTo('#container').animate({left: ((i+1)*20)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<3; ++i)
					$last = $('#imgDemo5').clone().prependTo('#container').animate({top: ((i+1)*28)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<5; ++i)
					$last = $('#imgDemo7').clone().prependTo('#container').animate({left: ((i+1)*23)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<5; ++i)
					$last = $('#imgDemo3').clone().prependTo('#container').animate({top: ((i+1)*18.5)+'px'});
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			}).queue(function() {
				var $last;
				for(var i=0; i<42; ++i) {
					$last = $('#imgDemo4').clone().prependTo('#container').animate({left: ((i%7)*20)+'px', top: (Math.floor(i/7)*18.5)+'px'});
				}										
				$last.queue(function() {
					$demo.dequeue();
					$(this).dequeue();
				})
			});
			break;
		default:
			break;
	}
}

function backToOrigin() {
$('#container').empty().append(
	'<img id="imgDemo0" src="media/greyDiamond.png" style="position:absolute;top:10px;left:20px;z-index:2;"/>'+
	'<img id="imgDemo1" src="media/blackDiamond.png" style="position:absolute;top:10px;left:50px;"/>'+
	'<img id="imgDemo2" src="media/greyDiamond.png" style="position:absolute;top:10px;left:80px;z-index:2;"/>'+
	
	'<img id="imgDemo3" src="media/blackDiamond.png" style="position:absolute;top:40px;left:20px;"/>'+
	'<img id="imgDemo4" src="media/redDiamond.png" style="position:absolute;top:40px;left:50px;"/>'+
	'<img id="imgDemo5" src="media/blackDiamond.png" style="position:absolute;top:40px;left:80px;"/>'+
	
	'<img id="imgDemo6" src="media/greyDiamond.png" style="position:absolute;top:70px;left:20px;z-index:2;"/>'+
	'<img id="imgDemo7" src="media/blackDiamond.png" style="position:absolute;top:70px;left:50px;"/>'+
	'<img id="imgDemo8" src="media/greyDiamond.png" style="position:absolute;top:70px;left:80px;z-index:2;"/>'+
	
	'<div style="position:absolute;top:112px;left:138px;z-index:1;width:30px;height:25px;background-color:red;"/>'+
	'<div style="position:absolute;top:112px;left:-20px;z-index:1;width:20px;height:25px;background-color:red;"/>'
);
};