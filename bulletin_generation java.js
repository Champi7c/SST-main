const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, PageOrientation, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, WidthType: WT
} = require('docx');
const fs = require('fs');
const path = require('path');

// Load logo image
const logoPath = '/home/claude/unpacked/word/media/image1.jpg';
const logoData = fs.readFileSync(logoPath);

// Helper: colored section header paragraph
function sectionHeader(text, bgColor) {
  return new Paragraph({
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '1F4788' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '1F4788' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '1F4788' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '1F4788' },
    },
    shading: { type: ShadingType.CLEAR, fill: bgColor },
    spacing: { before: 140, after: 100 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })
    ]
  });
}

// Helper: checkbox item
function checkboxItem(text, size = 15) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: '☐ ', size: 17 }),
      new TextRun({ text, size })
    ]
  });
}

// Left column items for a section
function sectionItems(items) {
  return items.map(([text, size]) => checkboxItem(text, size || 15));
}

// Patient info rows (light blue bg, gray border)
function patientRow(col1Label, col1Dots, col2Label, col2Dots) {
  const cellStyle = {
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    shading: { type: ShadingType.CLEAR, fill: 'E8F0F8' },
    margins: { top: 60, bottom: 60, left: 80, right: 80 }
  };
  return new TableRow({
    height: { value: 199 },
    children: [
      new TableCell({
        ...cellStyle,
        columnSpan: 2,
        children: [new Paragraph({
          children: [
            new TextRun({ text: col1Label + ': ', bold: true, size: 18 }),
            new TextRun({ text: col1Dots, color: 'CCCCCC', size: 18 })
          ]
        })]
      }),
      new TableCell({
        ...cellStyle,
        columnSpan: 2,
        children: [new Paragraph({
          children: [
            new TextRun({ text: col2Label + ': ', bold: true, size: 18 }),
            new TextRun({ text: col2Dots, color: 'CCCCCC', size: 18 })
          ]
        })]
      })
    ]
  });
}

// Build analysis column (col1: left, col2: middle, col3: right)
function buildAnalysisColumn(tableWidth) {
  const col1Items_hema = [
    ['NFS'], ['Taux Rét.'], ['T E'], ['V S'], ['G S'], ['Rhesus'], ['ABO'], ['RAI']
  ];
  const col1Items_bio = [
    ['G A J'], ['G P P'], ['HbA1c'], ['Urée'], ['Créat'], ['Acide urique'],
    ['PSA'], ['AFP'], ['Lipasémie'], ['Electroph. Pr'], ['Electroph. Hb'],
    ['TSH   ☐ T4'], ['PU 24'], ['Micro-albuminurie']
  ];

  const col2Items_lipid = [['Ch. total'], ['Ch. HDL'], ['Ch. LDL'], ['TGL']];
  const col2Items_iono = [['Na+ ☐ K+ ☐ Cl-'], ['Calcémie'], ['Phosphore'], ['Magnésémie'], ['Bicarbonates']];
  const col2Items_hep = [
    ['Bilirubine libre et conjuguée', 14], ['ASAT ALAT'], ['PAL'], ['GGT'], ['TP'], ['TCK'], ['INR'], ['Fibrinogène']
  ];

  const col3Items_sero = [
    ['AgHbs'], ['B-HCG Plasm.'], ['ASLO'], ['F. Rhumatoïde'], ['Widal et Félix'],
    ['BW (TPHA-RPR)', 14], ['CRP'], ['Waler Rose'], ['Ac Anti CCP'], ['Ac Anti DNA natif', 14]
  ];
  const col3Items_bact = [
    ['Hémoculture'], ['Goutte épaisse'], ['Frottis sanguin'], ['ECBU'],
    ['Compte d\'Addis', 14], ['Coproculture'], ['Selles KAOP'], ['Crachats BAAR']
  ];

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  // Widths for the 4 grid columns: 2396, 198, 2198, 2397 (total 7189)
  // Col1 = col 0 (2396), Col2 = col 1+2 span (2396), Col3 = col 3 (2397)
  const analysisRow = new TableRow({
    height: { value: 6843 },
    children: [
      // COL 1: HÉMATOLOGIE + BIOCHIMIE
      new TableCell({
        width: { size: 2396, type: WidthType.DXA },
        borders: noBorder,
        margins: { top: 20, bottom: 20, left: 40, right: 40 },
        children: [
          sectionHeader('HÉMATOLOGIE', '1F4788'),
          ...sectionItems(col1Items_hema),
          sectionHeader('BIOCHIMIE', '1F4788'),
          ...sectionItems(col1Items_bio),
        ]
      }),
      // COL 2: B.LIPIDIQUE + IONOGRAMME + F.HÉPATIQUE
      new TableCell({
        columnSpan: 2,
        width: { size: 2396, type: WidthType.DXA },
        borders: noBorder,
        margins: { top: 20, bottom: 20, left: 40, right: 40 },
        children: [
          sectionHeader('B. LIPIDIQUE', '1F4788'),
          ...sectionItems(col2Items_lipid),
          sectionHeader('IONOGRAMME SANGUIN', '2E75B6'),
          ...sectionItems(col2Items_iono),
          sectionHeader('F. HÉPATIQUE HÉMOSTASE', 'C41E3A'),
          ...sectionItems(col2Items_hep),
          // "Le Prescripteur" text box - approximate with paragraph
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({ text: '               ', bold: true, size: 18 }),
              new TextRun({ text: 'Le Prescripteur', bold: true, size: 18, underline: { type: 'single' } })
            ]
          }),
        ]
      }),
      // COL 3: SÉROLOGIE + BACTÉRIOLOGIE
      new TableCell({
        width: { size: 2397, type: WidthType.DXA },
        borders: noBorder,
        margins: { top: 20, bottom: 20, left: 40, right: 40 },
        children: [
          sectionHeader('SÉROLOGIE IMMUNOLOGIE', '8B4513'),
          ...sectionItems(col3Items_sero),
          sectionHeader('BACTÉRIOLOGIE PARASITOLOGIE', '2E8B57'),
          ...sectionItems(col3Items_bact),
        ]
      })
    ]
  });

  return analysisRow;
}

// Build one page (one side of the A3 landscape page)
function buildPage(logoData) {
  // Header table: logo + cabinet info, with blue bottom border
  const headerTable = new Table({
    width: { size: 7240, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E75B6' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideH: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
      insideV: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
    },
    columnWidths: [2200, 5040],
    rows: [
      new TableRow({
        children: [
          // Logo cell
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: logoData,
                    transformation: { width: 90, height: 90 },
                    type: 'jpg'
                  })
                ]
              })
            ]
          }),
          // Cabinet info cell
          new TableCell({
            width: { size: 5040, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            margins: { top: 40, bottom: 40, left: 100, right: 60 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'CABINET MÉDICAL LIONEL', bold: true, color: '1F4788', size: 22 })]
              }),
              new Paragraph({
                spacing: { before: 30, after: 15 },
                children: [new TextRun({ text: 'Autorisation n° : 26JUIL2022*022346', color: '333333', size: 15 })]
              }),
              new Paragraph({
                spacing: { after: 15 },
                children: [new TextRun({ text: 'RC : SN.THS.2024.A.266', color: '333333', size: 15 })]
              }),
              new Paragraph({
                children: [new TextRun({ text: 'NINEA : 010949412', color: '333333', size: 15 })]
              }),
              new Paragraph({ children: [] }),
              new Paragraph({
                children: [
                  new TextRun({ text: '\t', size: 18 }),
                  new TextRun({ text: 'Date : ', bold: true, size: 18 }),
                  new TextRun({ text: '..........................', color: 'CCCCCC', size: 18 })
                ]
              }),
            ]
          })
        ]
      })
    ]
  });

  // Title
  const title = new Paragraph({
    spacing: { before: 180, after: 160 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "BULLETIN D'ANALYSES", bold: true, color: '1F4788', size: 28 })
    ]
  });

  // Patient info table
  const patientTable = new Table({
    width: { size: 7189, type: WidthType.DXA },
    columnWidths: [2396, 198, 2198, 2397],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
      insideH: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
      insideV: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
    },
    rows: [
      patientRow('Nom', '.....................................', 'Prénom', '...............................'),
      new TableRow({
        height: { value: 199 },
        children: [
          new TableCell({
            columnSpan: 2,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
            shading: { type: ShadingType.CLEAR, fill: 'E8F0F8' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Age : ', bold: true, size: 18 }),
                new TextRun({ text: '............', color: 'CCCCCC', size: 18 }),
                new TextRun({ text: ' Sexe : ', bold: true, size: 18 }),
                new TextRun({ text: '............', color: 'CCCCCC', size: 18 })
              ]
            })]
          }),
          new TableCell({
            columnSpan: 2,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
            shading: { type: ShadingType.CLEAR, fill: 'E8F0F8' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Téléphone : ', bold: true, size: 18 }),
                new TextRun({ text: '..............................', color: 'CCCCCC', size: 18 })
              ]
            })]
          })
        ]
      }),
      buildAnalysisColumn(7189)
    ]
  });

  return [headerTable, title, patientTable, new Paragraph({ children: [] })];
}

// Full document: landscape A3 (16838 x 11906 DXA), two side-by-side columns via outer table
const outerContent = buildPage(logoData);
const outerContent2 = buildPage(logoData);

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: {
          width: 16838,
          height: 11906,
          orientation: PageOrientation.LANDSCAPE
        },
        margin: { top: 580, right: 580, bottom: 580, left: 580 }
      }
    },
    children: [
      // Outer 2-column table to get side-by-side layout
      new Table({
        width: { size: 15746, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
          insideH: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
          insideV: { style: BorderStyle.SINGLE, size: 4, color: 'auto' },
        },
        columnWidths: [7872, 7874],
        rows: [
          new TableRow({
            children: [
              // Left page
              new TableCell({
                width: { size: 7400, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                children: outerContent
              }),
              // Right page (duplicate)
              new TableCell({
                width: { size: 7400, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                children: outerContent2
              })
            ]
          })
        ]
      }),
      new Paragraph({ children: [] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/claude/Bulletin_Analyses_CML_LIONEL_REGEN.docx', buffer);
  console.log('Document créé avec succès !');
}).catch(err => {
  console.error('Erreur:', err);
});
