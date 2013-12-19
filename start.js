/**************************************************************************
 *
 *  This file is part of the UGE(Uniform Game Engine).
 *  Copyright (C) by SanPolo Co.Ltd. 
 *  All rights reserved.
 *
 *  See http://uge.spolo.org/ for more information.
 *
 *  SanPolo Co.Ltd
 *  http://uge.spolo.org/  sales@spolo.org uge-support@spolo.org
 *
**************************************************************************/

try {

	Plugin.Load("spp.behaviourlayer.jscript");
	Plugin.Load("spp.script.gui.cegui");
	Event.Send("application.open",true);

	var count = Event.InstallHelper('3d','frame');
	
	// 加载系统中的 js 库
	require("objlayout.js");	// 这里是加载 Entity 支持库
	require("ui.js");	// 这里加载 GUI 支持库
	// 测试用的加载库。
	//load("/loader_with_max_thread.js"); // require("loader.js");
	//load("/loader_wo_max_thread.js"); // require("loader.js");
    require("loader.js");
	require("cursesui.js");	// 在CUI上画图用的。
	
	// 多线程加载开始。
	Loader.Load({
		stages : [{
			name : "shader",
			weighing : 2, // 加载时间权重
			filename : "/art/shaderlib.xml"
		}, /*{
			name : "sound",
			weighing : 10,
			filename : "/art/soundlib.xml"
		}, */{
			name : "texture",
			weighing : 40,
			filename : "/art/materials.xml"
		}, {
			name : "material",
			weighing : 2,
			filename : "/art/materials.xml"
		}, {
			name : "meshfact",
			weighing : 40,
			filename : "/art/factorylib.xml"
		}, {
			name : "meshobj",
			weighing : 2,
			filename : "/art/world.xml"
		}/*, {
			name : "sequence",
			weighing : 2,
			filename : "/art/sequencelib.xml"
		}*/],
		onprocessWorldNode : onprocessWorldNode,
		onloadend : onloadend,
		onprogress : onprogress
	});
	
	///@brief 通过这个函数可以获得进度信息
	function onprogress(pe)
	{
		//以滚动条方式显示进度。
		CursesUI.ProgressBar(pe.total, pe.loaded);
	}
	
	///@brief 可以往`<world>`节点中添加新的节点。
	///方便viewscene工具处理。
	function onprocessWorldNode(node_world)
	{
	
	}
	
	///@brief 加载场景完事之后，所有处理都在这个函数中展开。
	function onloadend()
	{
		console.debug("on load end");
		
		var sectorlist = C3D.engine.sectors;
		alert(sectorlist.FindByName("Scene"));
		
		//加载factory
		Entities.LoadPropertyClassFactory('cel.pcfactory.input.standard');
		Entities.LoadPropertyClassFactory('cel.pcfactory.camera.old');
		Entities.LoadPropertyClassFactory('cel.pcfactory.object.mesh.collisiondetection');
		//Entities.LoadPropertyClassFactory('cel.pcfactory.world.zonemanager');
		Entities.LoadPropertyClassFactory('cel.pcfactory.object.mesh');
		Entities.LoadPropertyClassFactory('cel.pcfactory.move.linear');
		Entities.LoadPropertyClassFactory('cel.pcfactory.move.actor.standard'); 
		Entities.LoadPropertyClassFactory('cel.pcfactory.object.light');
		Entities.LoadPropertyClassFactory('cel.pcfactory.logic.trigger');

		console.debug("finish LoadPropertyClassFactory");
		
		var nowrun = false;
		var nowturn = false;

		// 创建Player。
		var player = Entities.CreateEntity();
		player.name = 'player';
		
		console.debug("finish CreateEntity");
		
		//prop_zone = Entities.CreatePropertyClass(player,'pczonemanager');
		prop_pm = Entities.CreatePropertyClass(player,'pcmesh');
		prop_cam = Entities.CreatePropertyClass(player,'pcdefaultcamera');
		prop_input = Entities.CreatePropertyClass(player,'pccommandinput');
		prop_ment = Entities.CreatePropertyClass(player,'pclinearmovement');
		prop_pcactor = Entities.CreatePropertyClass(player,'pcactormove');
		prop_collision = Entities.CreatePropertyClass(player,'pccollisiondetection');

		console.debug("finish CreatePropertyClass");
		
		//prop_zone.PerformAction('Load',['path','.'],['file','level.xml']);
		prop_cam.PerformAction("SetCamera",['modename', 'thirdperson']);
		prop_cam.PerformAction('SetZoneManager',['entity',player.name],['region','main'],['start','Camera']);
		
		// 添加移动和旋转速度 
		prop_pcactor.PerformAction('SetSpeed',['movement',40],['running',2],['rotation',2],['jumping',3]);
		
		// 设定一个mesh的名称。
		prop_pm.PerformAction('SetMesh', ['name','gnd85#1']);
		//为消息绑定键位
		//向前走
		prop_input.PerformAction('Bind',['trigger','w'],['command','forward']);
		//向后走
		prop_input.PerformAction('Bind',['trigger','s'],['command','backward']);
		//左转
		prop_input.PerformAction('Bind',['trigger','a'],['command','rotateleft']);
		//右转
		prop_input.PerformAction('Bind',['trigger','d'],['command','rotateright']);
		//跳跃（并未实现）
		prop_input.PerformAction('Bind',['trigger','space'],['command','jump']);
		//系统退出
		prop_input.PerformAction('Bind',['trigger','q'],['command','TESTINGMYquit']);
		//控制视角
		prop_input.PerformAction('Bind',['trigger','e'],['command','rotateup']);
		prop_input.PerformAction('Bind',['trigger','c'],['command','rotatedown']);
		//切换不同的视角tab键
		prop_input.PerformAction('Bind',['trigger','tab'],['command','changeview']);
		//鼠标移动
		prop_input.PerformAction('Bind',['trigger','MouseAxis0'],['command','mousemove']);
		
		console.debug("finish perform action.");
		
		//消息函数及其实现动作
		player.behaviour = function(msgid,pc,p1,p2,p3,p4,p5){
			//先前走
			if(msgid.indexOf('forward1')!=-1) {
				prop_pcactor.PerformAction('Forward', ['start', true]);
				prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);
				nowrun = true;
			}else if(msgid.indexOf('forward0')!=-1) {
				prop_pcactor.PerformAction('Forward', ['start', false]);
				
				if(nowturn) {
					prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);
				} else {
					prop_pm.PerformAction('SetAnimation',['animation','stand'],['cycle',true],['reset', true]);
				}
				
				nowrun = false;
			}
			//退出
			if(msgid.indexOf('TESTINGMYquit0')!=-1) {
				System.Quit();
			}
			if(msgid.indexOf('backward1')!=-1) {
				prop_pcactor.PerformAction('Backward', ['start', true]);
				prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);
				nowrun = true;
			}
			//向后走
			if(msgid.indexOf('backward0')!=-1) {
				prop_pcactor.PerformAction('Backward', ['start', false]);
				if(nowturn) {
					prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);
				} else {
					prop_pm.PerformAction('SetAnimation',['animation','stand'],['cycle',true],['reset', true]);
				}
				
				nowrun = false;
			}
			//左转
			if(msgid.indexOf('rotateleft1')!=-1) {
				prop_pcactor.PerformAction('RotateLeft', ['start', true]);

				prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);

				nowturn = true;
			}
			if(msgid.indexOf('rotateleft0')!=-1) {
				prop_pcactor.PerformAction('RotateLeft', ['start', false]);

				if(nowrun) {
					prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);
				} else {
					prop_pm.PerformAction('SetAnimation',['animation','stand'],['cycle',true],['reset', true]);
				}

				nowturn = false;

			}
			//右转
			if(msgid.indexOf('rotateright1')!=-1) {
				prop_pcactor.PerformAction('RotateRight', ['start', true]);

				prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);

				nowturn = true;

			}
			if(msgid.indexOf('rotateright0')!=-1) {
				prop_pcactor.PerformAction('RotateRight', ['start', false]);
				if(nowrun) {
					prop_pm.PerformAction('SetAnimation',['animation','run'],['cycle',true],['reset', false]);
				} else {
					prop_pm.PerformAction('SetAnimation',['animation','stand'],['cycle',true],['reset', true]);
				}
				nowturn = false;
			}
			//向上调视角
			if(msgid.indexOf('rotateup1')!=-1) {
				prop_cam.SetProperty('pitchvelocity',1.0);
			}
			
			if(msgid.indexOf('rotateup0')!=-1) {
				prop_cam.SetProperty('pitchvelocity',0.0);

				alert(prop_pm.GetProperty("position"));
			}
			//向下调视角
			if(msgid.indexOf('rotatedown1')!=-1) {
				prop_cam.SetProperty('pitchvelocity',-1.0);
			}
			
			if(msgid.indexOf('rotatedown0')!=-1) {
				prop_cam.SetProperty('pitchvelocity',0.0);
			}
			//tab改变视角
			if(msgid.indexOf('changeview0')!=-1) {
				prop_pcactor.PerformAction('ToggleCameraMode',[]);
			}
			//鼠标移动改变视角
			if(msgid.indexOf('mousemove')!=-1) {
				prop_cam.SetProperty('pitch', -p2[1]); //调整摄像机上下角度
				prop_cam.SetProperty('yaw', p1[1]);
			}
		}
	}
	
}catch(e){
	alert('error:',e);
}