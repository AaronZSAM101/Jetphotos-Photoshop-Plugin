let app = null;
let core = null;
let action = null;
let imaging = null;

try {
  const photoshop = require("photoshop");
  app = photoshop.app;
  core = photoshop.core;
  action = photoshop.action;
  imaging = photoshop.imaging;
} catch (error) {
  console.error("Failed to load Photoshop UXP APIs", error);
}

const SPOT_CHECK_LAYER_NAME = "JP Spot Check (temporary)";
const state = {
  equalizeOn: false,
  centerOn: false,
  fineOn: false
};

const els = {};

function bindElements() {
  els.equalize = document.getElementById("equalize");
  els.center = document.getElementById("center-grid");
  els.fine = document.getElementById("fine-grid");
  els.status = document.getElementById("status");
}

function setStatus(message) {
  if (els.status) els.status.textContent = message;
  console.log("[Photo Check]", message);
}

function clearStatusSoon() {
  setTimeout(() => {
    if (els.status) els.status.textContent = "";
  }, 2200);
}

function equalizeRgbChannels(data, components) {
  const total = Math.floor(data.length / components);
  const channels = Math.min(3, components);

  for (let c = 0; c < channels; c++) {
    const hist = new Uint32Array(256);
    for (let i = 0; i < total; i++) hist[data[i * components + c]]++;

    const cdf = new Uint32Array(256);
    let acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      cdf[i] = acc;
    }

    let cdfMin = 0;
    for (let i = 0; i < 256; i++) {
      if (cdf[i] > 0) {
        cdfMin = cdf[i];
        break;
      }
    }

    const denom = total - cdfMin;
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = denom > 0 ? Math.round((cdf[i] - cdfMin) / denom * 255) : i;
    }

    for (let i = 0; i < total; i++) {
      data[i * components + c] = lut[data[i * components + c]];
    }
  }
}

function getDocDimension(value) {
  if (typeof value === "number") return value;
  if (value && typeof value.value === "number") return value.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 1;
}

function createGuideDescriptor(documentID, position, orientation) {
  return {
    _obj: "make",
    new: {
      _obj: "good",
      position: {
        _unit: "pixelsUnit",
        _value: position
      },
      orientation: {
        _enum: "orientation",
        _value: orientation
      },
      kind: {
        _enum: "kind",
        _value: "document"
      },
      _target: [
        {
          _ref: "document",
          _id: documentID
        },
        {
          _ref: "good",
          _index: 1
        }
      ]
    },
    _target: [
      {
        _ref: "good"
      }
    ],
    guideTarget: {
      _enum: "guideTarget",
      _value: "guideTargetCanvas"
    },
    _isCommand: true,
    _options: {
      dialogOptions: "dontDisplay"
    }
  };
}

async function runWithSingleHistory(commandName, work) {
  if (!app || !core) {
    throw new Error("Photoshop UXP API 未加载，请确认插件是在 Photoshop 中运行");
  }

  const doc = app.activeDocument;
  if (!doc) {
    throw new Error("没有打开的 Photoshop 文档");
  }

  await core.executeAsModal(async (executionContext) => {
    const suspensionID = await executionContext.hostControl.suspendHistory({
      documentID: doc.id,
      name: commandName
    });
    let resumed = false;

    try {
      await work(doc, executionContext);
      suspensionID.finalName = commandName;
      await executionContext.hostControl.resumeHistory(suspensionID, true);
      resumed = true;
    } finally {
      if (!resumed) {
        try {
          await executionContext.hostControl.resumeHistory(suspensionID, false);
        } catch (error) {
          console.error("Failed to roll back suspended history", error);
        }
      }
    }
  }, { commandName });
}

async function playCommandsInModal(commands) {
  if (!commands.length) return;
  await action.batchPlay(commands, {
    synchronousExecution: false,
    modalBehavior: "execute"
  });
}

async function addGuides(commands, commandName) {
  if (!app || !core || !action) {
    throw new Error("Photoshop UXP API 未加载，请确认插件是在 Photoshop 中运行");
  }

  await runWithSingleHistory(commandName, async () => {
    await playCommandsInModal(commands);
  });
}

async function rebuildActiveGuides(commandName = "更新参考线") {
  const wantsCenter = state.centerOn;
  const wantsFine = state.fineOn;

  await runWithSingleHistory(commandName, async (doc) => {
    if (doc.guides && typeof doc.guides.removeAll === "function") {
      await doc.guides.removeAll();
    } else {
      await action.batchPlay([
        {
          _obj: "clearAllGuides",
          _options: {
            dialogOptions: "dontDisplay"
          }
        }
      ], {
        synchronousExecution: false,
        modalBehavior: "execute"
      });
    }

    const commands = [
      ...(wantsCenter ? centerGuideCommands(doc) : []),
      ...(wantsFine ? fineGuideCommands(doc) : [])
    ];
    await playCommandsInModal(commands);
  });
}

function centerGuideCommands(doc) {
  const width = getDocDimension(doc.width);
  const height = getDocDimension(doc.height);
  return [
    createGuideDescriptor(doc.id, width * 0.2314, "vertical"),
    createGuideDescriptor(doc.id, width * 0.5, "vertical"),
    createGuideDescriptor(doc.id, width * 0.7686, "vertical"),
    createGuideDescriptor(doc.id, height * 0.2804, "horizontal"),
    createGuideDescriptor(doc.id, height * 0.5, "horizontal"),
    createGuideDescriptor(doc.id, height * 0.7196, "horizontal")
  ];
}

async function addCenterGuides() {
  const doc = app.activeDocument;
  const commands = centerGuideCommands(doc);

  await addGuides(commands, "添加居中参考线");
}

function fineGuideCommands(doc) {
  const width = getDocDimension(doc.width);
  const height = getDocDimension(doc.height);
  const spacingX = Math.max(4, width * 25 / 1024);
  const spacingY = Math.max(4, height * 25 / 683);
  const commands = [];

  for (let x = spacingX; x < width; x += spacingX) {
    commands.push(createGuideDescriptor(doc.id, x, "vertical"));
  }
  for (let y = spacingY; y < height; y += spacingY) {
    commands.push(createGuideDescriptor(doc.id, y, "horizontal"));
  }

  return commands;
}

async function addFineGuides() {
  const doc = app.activeDocument;
  const commands = fineGuideCommands(doc);

  await addGuides(commands, "添加地平参考线");
}

async function getImageData(imageObj) {
  const imageData = imageObj.imageData;
  const raw = await imageData.getData({ chunky: true });
  return {
    width: imageData.width,
    height: imageData.height,
    components: imageData.components || 4,
    colorProfile: imageData.colorProfile || "sRGB IEC61966-2.1",
    data: new Uint8ClampedArray(raw),
    dispose: () => imageData.dispose()
  };
}

function findLayerByName(layers, name) {
  if (!layers) return null;
  for (const layer of layers) {
    if (layer.name === name) return layer;
    const found = findLayerByName(layer.layers, name);
    if (found) return found;
  }
  return null;
}

async function removeSpotCheckLayer() {
  if (!app || !core) {
    throw new Error("Photoshop UXP API 未加载，请确认插件是在 Photoshop 中运行");
  }

  await runWithSingleHistory("移除污点检查图层", async (doc) => {
    const layer = findLayerByName(doc.layers, SPOT_CHECK_LAYER_NAME);
    if (layer) layer.delete();
  });

  state.equalizeOn = false;
  syncPreview();
}

async function toggleSpotCheckLayer() {
  if (!app || !core || !imaging) {
    throw new Error("Photoshop UXP API 未加载，请确认插件是在 Photoshop 中运行");
  }

  const doc = app.activeDocument;
  if (!doc) {
    throw new Error("没有打开的 Photoshop 文档");
  }

  const existing = findLayerByName(doc.layers, SPOT_CHECK_LAYER_NAME);
  if (existing) {
    await removeSpotCheckLayer();
    setStatus("已移除污点检查图层");
    return;
  }

  setStatus("正在生成污点检查图层...");

  await runWithSingleHistory("生成污点检查图层", async (doc) => {
    const previousLayer = findLayerByName(doc.layers, SPOT_CHECK_LAYER_NAME);
    if (previousLayer) previousLayer.delete();

    const imageObj = await imaging.getPixels({
      documentID: doc.id,
      colorSpace: "RGB",
      componentSize: 8,
      applyAlpha: true
    });

    const source = await getImageData(imageObj);
    let targetImageData = null;
    try {
      const equalized = new Uint8Array(source.data);
      equalizeRgbChannels(equalized, source.components);

      const layer = await doc.createPixelLayer({
        name: SPOT_CHECK_LAYER_NAME,
        opacity: 100,
        fillNeutral: false
      });

      targetImageData = await imaging.createImageDataFromBuffer(equalized, {
        width: source.width,
        height: source.height,
        components: source.components,
        chunky: true,
        colorProfile: source.colorProfile,
        colorSpace: "RGB"
      });

      await imaging.putPixels({
        documentID: doc.id,
        layerID: layer.id,
        imageData: targetImageData,
        replace: true,
        targetBounds: { left: 0, top: 0 },
        commandName: "检查污点"
      });
      layer.bringToFront();
    } finally {
      if (targetImageData) targetImageData.dispose();
      source.dispose();
    }
  });

  state.equalizeOn = true;
  syncPreview();
  setStatus("已显示污点检查图层；再点一次可移除");
}

function syncPreview() {
  els.equalize.classList.toggle("active", state.equalizeOn);
  els.center.classList.toggle("active", state.centerOn);
  els.fine.classList.toggle("active", state.fineOn);
}

function init() {
  bindElements();
  if (!els.equalize || !els.center || !els.fine) {
    console.error("Photo Check UI elements were not found");
    return;
  }

  els.equalize.addEventListener("click", async () => {
    try {
      await toggleSpotCheckLayer();
      clearStatusSoon();
    } catch (error) {
      console.error(error);
      setStatus(error && error.message ? error.message : String(error));
    }
  });
  els.center.addEventListener("click", async () => {
    state.centerOn = !state.centerOn;
    syncPreview();
    setStatus(state.centerOn ? "正在添加居中参考线..." : "正在移除居中参考线...");
    try {
      await rebuildActiveGuides("更新居中参考线");
      const active = [state.centerOn && "居中", state.fineOn && "地平"].filter(Boolean).join(" + ");
      setStatus(active ? `已显示参考线：${active}` : "已清除当前文档参考线");
      clearStatusSoon();
    } catch (error) {
      console.error(error);
      state.centerOn = !state.centerOn;
      syncPreview();
      setStatus(error && error.message ? error.message : String(error));
    }
  });
  els.fine.addEventListener("click", async () => {
    state.fineOn = !state.fineOn;
    syncPreview();
    setStatus(state.fineOn ? "正在添加地平参考线..." : "正在移除地平参考线...");
    try {
      await rebuildActiveGuides("更新地平参考线");
      const active = [state.centerOn && "居中", state.fineOn && "地平"].filter(Boolean).join(" + ");
      setStatus(active ? `已显示参考线：${active}` : "已清除当前文档参考线");
      clearStatusSoon();
    } catch (error) {
      console.error(error);
      state.fineOn = !state.fineOn;
      syncPreview();
      setStatus(error && error.message ? error.message : String(error));
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
