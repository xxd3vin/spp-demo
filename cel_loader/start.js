//this is a test.

try {

	Plugin.Load("spp.behaviourlayer.jscript");
	Event.Send("application.open",true);

	var count = Event.InstallHelper('3d','frame');
	
    // 加载property class的factory
	Entities.LoadPropertyClassFactory('cel.pcfactory.input.standard');
	Entities.LoadPropertyClassFactory('cel.pcfactory.camera.old');
	Entities.LoadPropertyClassFactory('cel.pcfactory.object.mesh.collisiondetection');
	Entities.LoadPropertyClassFactory('cel.pcfactory.world.zonemanager');
	Entities.LoadPropertyClassFactory('cel.pcfactory.object.mesh');
	Entities.LoadPropertyClassFactory('cel.pcfactory.move.linear');
	Entities.LoadPropertyClassFactory('cel.pcfactory.move.actor.standard'); 
	Entities.LoadPropertyClassFactory('cel.pcfactory.object.light');
	Entities.LoadPropertyClassFactory('cel.pcfactory.logic.trigger');

	// 创建Player。
	var player = Entities.CreateEntity();
	player.name = 'player';
	
	// 为player创建property class
	prop_zone = Entities.CreatePropertyClass(player,'pczonemanager');
	prop_pm = Entities.CreatePropertyClass(player,'pcmesh');
	prop_cam = Entities.CreatePropertyClass(player,'pcdefaultcamera');
	prop_input = Entities.CreatePropertyClass(player,'pccommandinput');
	prop_ment = Entities.CreatePropertyClass(player,'pclinearmovement');
	prop_pcactor = Entities.CreatePropertyClass(player,'pcactormove');
	prop_collision = Entities.CreatePropertyClass(player,'pccollisiondetection');

	prop_zone.PerformAction('Load', ['path', '.'], ['file', '/art/world.xml']);
	prop_cam.PerformAction("SetCamera",['modename', 'thirdperson']);
	prop_cam.PerformAction('SetZoneManager',['entity',player.name],['region','main'],['start','Camera']);
	
	// 添加移动和旋转速度 
	prop_pcactor.PerformAction('SetSpeed',['movement',4],['running',2],['rotation',2],['jumping',3]);
	
	// 设定一个mesh的名称。
	prop_pm.PerformAction('SetMesh', ['name','Player']);
	
	// 为消息绑定键位
	prop_input.PerformAction('Bind', ['trigger', 'w'], ['command', 'forward']);			// 前进
	prop_input.PerformAction('Bind', ['trigger', 's'], ['command', 'backward']);		// 后退
	prop_input.PerformAction('Bind', ['trigger', 'a'], ['command', 'rotateleft']);		// 左转
	prop_input.PerformAction('Bind', ['trigger', 'd'], ['command', 'rotateright']);		// 右转
	prop_input.PerformAction('Bind', ['trigger', 'q'], ['command', 'strafeleft']);		// 左平移
	prop_input.PerformAction('Bind', ['trigger', 'e'], ['command', 'straferight']);		// 右平移
	prop_input.PerformAction('Bind', ['trigger', 't'], ['command', 'strafeup']);		// 上升
	prop_input.PerformAction('Bind', ['trigger', 'g'], ['command', 'strafedown']);		// 下降
	prop_input.PerformAction('Bind', ['trigger', 'tab'], ['command', 'changeview']);	// 切换视角
	//prop_input.PerformAction('Bind', ['trigger', 'MouseAxis0'], ['command', 'mousemove']); // 纵轴鼠标移动

	//消息函数及其实现动作
	player.behaviour = function(msgid,pc,p1,p2,p3,p4,p5){
	    // 前进
		if(msgid.indexOf('forward1')!=-1) {
			prop_pcactor.PerformAction('Forward', ['start', true]);
		}else if(msgid.indexOf('forward0')!=-1) {
			prop_pcactor.PerformAction('Forward', ['start', false]);
		}
		
		// 后退
		if(msgid.indexOf('backward1')!=-1) {
			prop_pcactor.PerformAction('Backward', ['start', true]);
		} else if(msgid.indexOf('backward0')!=-1) {
			prop_pcactor.PerformAction('Backward', ['start', false]);
		}
		
        // 左转
		if(msgid.indexOf('rotateleft1')!=-1) {
			prop_pcactor.PerformAction('RotateLeft', ['start', true]);
		} else if(msgid.indexOf('rotateleft0')!=-1) {
			prop_pcactor.PerformAction('RotateLeft', ['start', false]);
		}
		
        // 右转
		if(msgid.indexOf('rotateright1')!=-1) {
			prop_pcactor.PerformAction('RotateRight', ['start', true]);
		} else if(msgid.indexOf('rotateright0')!=-1) {
			prop_pcactor.PerformAction('RotateRight', ['start', false]);
		}
		
		// 左平移
		if(msgid.indexOf('strafeleft1')!=-1) {
			prop_pcactor.PerformAction('StrafeLeft', ['start', true]);
		} else if(msgid.indexOf('strafeleft0')!=-1) {
			prop_pcactor.PerformAction('StrafeLeft', ['start', false]);
		}
		
		// 右平移
		if(msgid.indexOf('straferight1')!=-1) {
			prop_pcactor.PerformAction('StrafeRight', ['start', true]);
		} else if(msgid.indexOf('straferight0')!=-1) {
			prop_pcactor.PerformAction('StrafeRight', ['start', false]);
		}
		
		// tab改变视角
		if(msgid.indexOf('changeview0')!=-1) {
			prop_pcactor.PerformAction('ToggleCameraMode',[]);
		}
		
		// 鼠标移动改变视角
		if(msgid.indexOf('mousemove')!=-1) {
			prop_cam.SetProperty('pitch', -p2[1]); //调整摄像机上下角度
			prop_cam.SetProperty('yaw', p1[1]);
		}
	}
	
}catch(e){
	alert('error:',e);
}