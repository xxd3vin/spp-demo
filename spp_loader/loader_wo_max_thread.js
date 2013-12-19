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

try{

require("console.js");
require("xmlDocument.js");

/// 全局对象Loader用于管理SPP所有加载问题。
var Loader = null;

(function(){
	Loader = new Object();
	
	// 初始化CS层的Loader
	var iLoader = Registry.Get('iLoader');
	var iThreadedLoader = Registry.Get('iThreadedLoader');
	iThreadedLoader.flags = 1;
	
	/// @brief 按照类型来创建临时节点。
	var createTmpLibNode = function(node, type)
	{
		var tmpdoc = new xmlDocument();
		var tmproot = tmpdoc.CreateRoot();
		var tmplibnodes = tmproot.CreateChild(xmlDocument.NODE_ELEMENT);
		tmplibnodes.value = "library";
		var tmpnode = tmplibnodes.CreateChild(xmlDocument.NODE_ELEMENT);
		if(type == "library")
		{
			var tmptextnode = tmpnode;
		}
		else
		{
			tmpnode.value = type;
			var tmptextnode = tmpnode.CreateChild(xmlDocument.NODE_ELEMENT);
		}
		if(!xmlDocument.CopyNode(tmptextnode, node))
		{
			console.debug("Failed to copy node");
			return false;
		}
		
		// 如果我们在调试，那么把这些东西写入文件，方便查看。
		if(CmdLine.GetOption("debug", 0) == "chenyang" && type == "library")
		{
			var filename = "/debug/" + type + Math.floor((Math.random()*10000000)+1) + ".xml";
			console.debug(filename);
			var file = VFS.Open(filename, VFS.WRITE);
			if(file)
			{
				tmpdoc.WritetoFile(file);
				file.Flush();
			}
		}
		
		return tmplibnodes;
	};
	
	/**
	 * @brief 根据节点名称来创建临时节点，包含在world节点中。
	 * @details 以下演示，参数为`<sound>`节点。
	 * <code>
	 * <world>
	 *   <sounds>
	 *     <sound>
	 *       <file>...</file>
	 *       [...]
	 *     </sound>
	 *   </sounds>
	 * </world>
	 * <code>
	 */
	var createTmpWorldNode = function(node, typename)
	{
		var tmpdoc = new xmlDocument();
		var tmproot = tmpdoc.CreateRoot();
		var tmplibnodes = tmproot.CreateChild(xmlDocument.NODE_ELEMENT);
		tmplibnodes.value = "world";
		var tmpnode = tmplibnodes.CreateChild(xmlDocument.NODE_ELEMENT);
		tmpnode.value = typename + "s";
		var tmptextnode = tmpnode.CreateChild(xmlDocument.NODE_ELEMENT);
		if(!xmlDocument.CopyNode(tmptextnode, node))
		{
			console.debug("Failed to copy node");
			return false;
		}
		
		// 如果我们在调试，那么把这些东西写入文件，方便查看。
		if(CmdLine.GetOption("debug", 0) == "chenyang")
		{
			var filename = "/debug/" + typename + Math.floor((Math.random()*10000000)+1) + ".xml";
			console.debug(filename);
			var file = VFS.Open(filename, VFS.WRITE);
			if(file)
			{
				tmpdoc.WritetoFile(file);
				file.Flush();
			}
		}
		
		return tmplibnodes;
	};
	
	/**
	 * @brief 获得下一个需要加载的stage
	 * 如果下一个stage指定的文件不存在，则继续寻找下下个stage。
	 * 如果当前stage是数组的最后一名，则返回false
	 */
	var getNextStage = function(currentStageName)
	{
		// 使用for in结构的话，idx的类型为String，当idx+1的时候就郁闷了。
		for(var idx = 0; idx < Loader.Stage.length; idx++)
		{
			if(Loader.Stage[idx].name == currentStageName)
			{
				// 确保不越界。
				if((idx+1) >= Loader.Stage.length)
				{
					return false;
				}
				return Loader.Stage[idx+1];
			}
		}
	};
	
	/**
	 * @brief 获得指定名称的stage
	 */
	var getStage = function(stageName)
	{
		for(var idx in Loader.Stage)
		{
			if(Loader.Stage[idx].name == stageName)
			{
				return Loader.Stage[idx];
			}
		}
	};
	
	/**
	 * @brief 获得需要加载的所有stage的权重总和，用于计算滚动条。
	 */
	var getAllWeighing = function()
	{
		var all_weighing = 0;
		for(var idx in Loader.Stage)
		{
			all_weighing += Loader.Stage[idx].weighing;
		}
		return all_weighing;
	};
	
	/**
	 * @brief 直接加载包含`<shaders>`的lib文件。
	 */
	Loader.LoadShaderLibFile = function(filename)
	{
		if(!VFS.Exists(filename))
		{
			alert("File not exist : " + filename);
			exit(1);
		}
		iLoader.LoadLibrary(filename);
	};
	
	/**
	 * @brief 读取`*lib.xml`或者`materials.xml`或者`factorylib.xml`文件，加载其中所有节点
	 * @details `materails.xml`比较特殊，包含了<textures>和<materials>两个主节点。
	 * `factorylib.xml`比较特殊，读取的节点深度不同。
	 */
	Loader.LoadLibrary = function(filename, typename, onprogress, finish)
	{
		// 由于是并发加载，需要一个数组保存所有的返回结果。
		var iThreadReturnList = new Array();
		
		var rootnode = xmlDocument.getRootNode(filename, "library");
		
		if(!rootnode)
		{
			alert("Failed to open file " + filename);
			exit(1);
		}
		
		if(typename == "meshfact")
		{
			var typeNodeItr = rootnode.GetChildren("library");
		}
		else
		{
			var typesNode = rootnode.GetChild(typename + "s");
			var typeNodeItr = typesNode.GetChildren(typename);
		}
		var idx = 0;
		// 遍历每个`<texture>`节点，并加载之。
		while(typeNodeItr.HasNext())
		{
			// 获取`<texture>`节点
			var typeNode = typeNodeItr.Next();
			
			if(typename == "meshfact")
			{
				// 创建临时节点，用于加载单个
				var tmpWorldNodes = createTmpLibNode(typeNode, "library");
				// 加载创建出来的这个单独的节点。
				iThreadReturnList[idx] = iThreadedLoader.LoadLibrary('/art/', tmpWorldNodes);
			}
			else
			{
				// 创建临时节点，用于加载单个
				var tmpWorldNodes = createTmpWorldNode(typeNode, typename);
				// 加载创建出来的这个单独的节点。
				iThreadReturnList[idx] = iThreadedLoader.LoadMap('/art/', tmpWorldNodes, false);
			}
			idx++;
		}
		
		var finish_count = 0;
		var finishfunc = function(){
			finish_count++;
			
			// 释放内存。
			C3D.engine.Prepare();
			
			// 回调用户，进度条步进。
			onprogress(typename, {
				total : iThreadReturnList.length,
				loaded : finish_count
			});
			
			// 所有线程都加载完毕，让用户决定下一步进行什么。
			if(finish_count >= iThreadReturnList.length)
			{
				finish(typename);
			}
		}
		for(var i = 0; i < iThreadReturnList.length; i++)
		{
			iThreadReturnList[i].onfinish = finishfunc;
		}
	};
	
	/**
	 * @brief 解析`world.xml`文件，仅仅加载其中的`sector`节点中的内容。
	 * @param {String} 需要解析的XML文件名称
	 * @param {Function} 用户可以通过这个回调函数往场景中添加对象
	 * @param {String} 当场景加载完毕之后会调用这个回调函数。
	 */
	Loader.LoadSector = function(filename, typename, processWorldNode, finish)
	{
		var rootnode = xmlDocument.getRootNode(filename, "world");
		
		if(!rootnode)
		{
			alert("Failed to open file " + filename);
			exit(1);
		}
		
		var worldChildItr = rootnode.GetChildren();
		
		// 在<world>中，除了<sector>节点，其他都删除。
		{
			while(worldChildItr.HasNext())
			{
				// 获取`<library>`节点
				var node = worldChildItr.Next();
				if(node.value != "sector")
				{
					rootnode.RemoveChildren(node);
				}
			}
		}
		
		// 让用户可以定制该sector
		processWorldNode.call(this, rootnode);
		
		var iThreadReturn = iThreadedLoader.LoadMap('/art/', rootnode, false);
		iThreadReturn.onfinish = function()
		{
			finish(typename);
		};
	};
	
	/**
	 * @brief 加载整个场景
	 * @param {Function} param.onprocessWorldNode 回调，用户可以在加载之前往sector上添加meshobj
	 * @param {Function} param.onloadend 回调，加载结束，执行序列交给用户。
	 * @param {Function} param.onprogress 回调，在每次进度步进的时候调用。
	 * @details 场景文件包括
	 * shaderlib.xml
	 * soundlib.xml -- 可选
	 * materials.xml
	 * factorylib.xml
	 * world.xml
	 * sequencelib.xml -- 可选
	 * 加载过程每一个项目的相对权重。
	 * shaders    - 2
	 * sounds     - 10
	 * textures   - 40
	 * materials  - 2
	 * meshfact   - 40
	 * sector     - 4
	 * sequence   - 2
	 */
	Loader.Load = function(param)
	{
		/**
		 * @fixme 这些文件应该交给用户定制。
		 */
		Loader.Stage = param.stages;
		//进度值，0～100
		Loader.progress = 0;
		
		// 计算需要记载的项目
		var all_weighing = getAllWeighing();
		
		// 设定进度为0
		param.onprogress({
			total : 100,
			loaded : 0
		});
		
		var onprogressProxy = function(typename, pe)
		{
			var weighing = getStage(typename).weighing;
			var loaded = Loader.progress + (pe.loaded/pe.total)*weighing;
			param.onprogress({
				total : 100,
				loaded : (loaded/all_weighing)*100
			});
		};
		
		var finishAll = function(){
			
			// 释放内存。
			C3D.engine.Prepare();
			
			// 所有加载都结束，执行序列交给用户。
			// 最后将进度调节成100%
			param.onprogress({
				total : 100,
				loaded : 100
			});
		
			console.debug("Finish loading sector defined in world.xml");
			// 加载结束
			param.onloadend();
		};
		
		var onloadnext = function(currentStageName){
			console.debug("Finish loading " + currentStageName);
			// 把自己的权重加上去。
			Loader.progress += getStage(currentStageName).weighing;
			
			var nextStageFilename = getNextStage(currentStageName).filename;
			var nextStageName = getNextStage(currentStageName).name;
			
			// 是否还有下一个stage
			if(!nextStageName)
			{
				finishAll();
				return;
			}
			
			if(nextStageName == "meshobj")
				Loader.LoadSector(getStage("meshobj").filename, "meshobj", param.onprocessWorldNode, onloadnext);
			else
				Loader.LoadLibrary(nextStageFilename, nextStageName, onprogressProxy, onloadnext);
		};
		Loader.LoadLibrary(getStage("shader").filename, "shader", onprogressProxy, onloadnext);
	};
	
})();

}catch(e){
	alert(e);
}