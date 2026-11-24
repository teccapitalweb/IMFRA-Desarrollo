import "./workbook-preview.css";
import type { Cell, Color, Worksheet } from "exceljs";

declare global {
  interface Window {
    IMFRAWorkbookPreview: { mount(host: HTMLElement, file: Blob, signal: AbortSignal): Promise<void> };
  }
}

const decimal = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 12 });

function valueText(cell: Cell): string {
  const value = cell.result ?? cell.value;
  if (value instanceof Date) return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(value);
  if (typeof value !== "number") return cell.text;
  const format = (cell.numFmt || "").split(";")[0];
  if (!format || /^general$/i.test(format)) return decimal.format(value);
  const fraction = format.match(/\.([0#]+)/)?.[1] || "";
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: (fraction.match(/0/g) || []).length,
    maximumFractionDigits: fraction.length
  };
  if (/%/.test(format)) options.style = "percent";
  else if (/\$/.test(format)) Object.assign(options, { style: "currency", currency: "MXN", currencyDisplay: "narrowSymbol" });
  else if (/e[+\-]/i.test(format)) options.notation = "scientific";
  else if (!/[0#]/.test(format)) return decimal.format(value);
  return new Intl.NumberFormat("es-MX", options).format(value);
}

function opaqueColor(color: Partial<Color> | undefined): string {
  const argb = color?.argb;
  return argb && /^(?:FF)?[a-f\d]{6}$/i.test(argb) ? `#${argb.slice(-6)}` : "";
}

function columnLabel(index: number): string {
  let label = "";
  while (index) {
    index--;
    label = String.fromCharCode(65 + index % 26) + label;
    index = Math.floor(index / 26);
  }
  return label;
}

function drawSheet(host: HTMLElement, sheet: Worksheet, images: Map<string, string>) {
  const pictures = sheet.getImages().filter(image => images.has(image.imageId));
  const cols = Math.max(sheet.columnCount, ...pictures.map(image => Math.ceil(image.range.br?.col ?? image.range.tl.col + 4)));
  const rows = Math.max(sheet.rowCount, ...pictures.map(image => Math.ceil(image.range.br?.row ?? image.range.tl.row + 8)));
  if (!cols || !rows) {
    host.replaceChildren(Object.assign(document.createElement("p"), { className: "workbook-preview__empty", textContent: "Esta hoja está vacía." }));
    return;
  }

  const widths = Array.from({ length: cols }, (_, index) => Math.max(42, Math.min(420, (sheet.getColumn(index + 1).width || 10) * 7 + 5)));
  const heights = Array.from({ length: rows }, (_, index) => Math.max(23, (sheet.getRow(index + 1).height || 15) * 4 / 3));
  const rowOffsets = [0];
  const colOffsets = [0];
  heights.forEach(height => rowOffsets.push(rowOffsets[rowOffsets.length - 1] + height));
  widths.forEach(width => colOffsets.push(colOffsets[colOffsets.length - 1] + width));
  const rowHeaderWidth = 40;
  const columnHeaderHeight = 26;
  const grid = document.createElement("div");
  grid.className = "workbook-preview__grid";
  grid.style.width = `${colOffsets[cols] + rowHeaderWidth}px`;
  const table = document.createElement("table");
  table.setAttribute("aria-label", sheet.name);
  const columns = table.appendChild(document.createElement("colgroup"));
  [rowHeaderWidth, ...widths].forEach(width => { columns.appendChild(document.createElement("col")).style.width = `${width}px`; });
  const header = table.createTHead().insertRow();
  header.style.height = `${columnHeaderHeight}px`;
  header.appendChild(document.createElement("th"));
  for (let column = 1; column <= cols; column++) {
    const th = header.appendChild(document.createElement("th"));
    th.scope = "col";
    th.textContent = columnLabel(column);
  }

  const merges = new Map<string, [number, number]>();
  for (const range of sheet.model.merges) {
    const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
    if (!match) continue;
    const [, start, firstRow, end, lastRow] = match;
    const position = (letters: string) => [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0);
    merges.set(start + firstRow, [Number(lastRow) - Number(firstRow) + 1, position(end) - position(start) + 1]);
  }

  const body = table.createTBody();
  for (let row = 1; row <= rows; row++) {
    const tr = body.insertRow();
    tr.style.height = `${heights[row - 1]}px`;
    const label = tr.appendChild(document.createElement("th"));
    label.scope = "row";
    label.textContent = String(row);
    for (let column = 1; column <= cols; column++) {
      const cell = sheet.getCell(row, column);
      if (cell.isMerged && cell.master.address !== cell.address) continue;
      const td = tr.insertCell();
      const merge = merges.get(cell.address);
      if (merge) [td.rowSpan, td.colSpan] = merge;
      const text = valueText(cell);
      const contents = td.appendChild(document.createElement("div"));
      contents.textContent = text;
      contents.title = text;
      contents.style.maxHeight = `${rowOffsets[row - 1 + (merge?.[0] || 1)] - rowOffsets[row - 1]}px`;
      const fill = cell.fill;
      const background = fill?.type === "pattern" && fill.pattern === "solid" ? opaqueColor(fill.fgColor) : "";
      const color = opaqueColor(cell.font?.color);
      td.style.backgroundColor = background;
      td.style.color = !background && /^#ffffff$/i.test(color) ? "" : color;
      td.style.fontWeight = cell.font?.bold ? "700" : "";
      td.style.fontStyle = cell.font?.italic ? "italic" : "";
      const align = cell.alignment?.horizontal;
      if (align === "center" || align === "centerContinuous") td.style.textAlign = "center";
      else if (align === "right" || (!align && typeof (cell.result ?? cell.value) === "number")) td.style.textAlign = "right";
      if (cell.alignment?.wrapText) contents.classList.add("is-wrapped");
    }
  }
  grid.appendChild(table);

  const offset = (index: number, sizes: number[], edges: number[]) => {
    const whole = Math.floor(index);
    return edges[whole] + (index - whole) * (sizes[whole] || 0);
  };
  for (const picture of pictures) {
    const { tl, br } = picture.range;
    const ext = (picture.range as typeof picture.range & { ext?: { width: number; height: number } }).ext;
    const left = offset(tl.col, widths, colOffsets);
    const top = offset(tl.row, heights, rowOffsets);
    const img = document.createElement("img");
    img.src = images.get(picture.imageId)!;
    img.alt = "Imagen de la hoja de cálculo";
    img.style.left = `${left + rowHeaderWidth}px`;
    img.style.top = `${top + columnHeaderHeight}px`;
    img.style.width = `${br ? offset(br.col, widths, colOffsets) - left : ext?.width || 180}px`;
    img.style.height = `${br ? offset(br.row, heights, rowOffsets) - top : ext?.height || 100}px`;
    grid.appendChild(img);
  }
  host.replaceChildren(grid);
}

async function mount(host: HTMLElement, file: Blob, signal: AbortSignal) {
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  await book.xlsx.load(await file.arrayBuffer());
  if (signal.aborted) return;
  const sheets = book.worksheets.filter(sheet => sheet.state === "visible");
  if (!sheets.length) throw new Error("El archivo no contiene hojas visibles.");

  const images = new Map<string, string>();
  for (const sheet of sheets) {
    for (const { imageId } of sheet.getImages()) {
      if (images.has(imageId)) continue;
      const image = book.getImage(Number(imageId));
      if (!image?.buffer || !/^(?:png|jpe?g|gif)$/i.test(image.extension || "")) continue;
      const type = /jpe?g/i.test(image.extension) ? "image/jpeg" : `image/${image.extension}`;
      images.set(imageId, URL.createObjectURL(new Blob([new Uint8Array(image.buffer)], { type })));
    }
  }
  signal.addEventListener("abort", () => images.forEach(url => URL.revokeObjectURL(url)), { once: true });

  const viewer = document.createElement("div");
  viewer.className = "workbook-preview";
  const scroll = document.createElement("div");
  scroll.className = "workbook-preview__scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("aria-label", "Contenido de la hoja");
  const toolbar = document.createElement("label");
  toolbar.className = "workbook-preview__sheets";
  toolbar.append("Hoja ");
  const select = toolbar.appendChild(document.createElement("select"));
  sheets.forEach((sheet, index) => select.append(new Option(sheet.name.trim(), String(index))));
  select.onchange = () => {
    drawSheet(scroll, sheets[Number(select.value)], images);
    scroll.scrollTo(0, 0);
  };
  toolbar.appendChild(Object.assign(document.createElement("small"), { textContent: "Vista de solo lectura" }));
  drawSheet(scroll, sheets[0], images);
  viewer.append(toolbar, scroll);
  host.replaceChildren(viewer);
}

window.IMFRAWorkbookPreview = { mount };
