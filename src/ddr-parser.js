/**
 * FileMaker DDR XML Parser
 * 
 * This parser extracts schema information from FileMaker Database Design Report (DDR) XML files.
 * See FILEMAKER_DDR_PARSER_SPEC.md for detailed documentation on XML structure.
 */

/**
 * Parse multiple DDR XML files and return unified schema data
 * @param {File[]} files - Array of File objects from file input
 * @returns {Promise<ParsedDDR>} - Parsed schema data
 */
export async function parseXMLFiles(files) {
  const databases = [];
  
  // Parse each file
  for (const file of files) {
    const xmlText = await readFileAsText(file);
    const db = parseXML(xmlText);
    if (db) databases.push(db);
  }
  
  // Build reverse references across all databases
  const reverseRefs = buildReverseReferences(databases);
  
  // Find cross-file references
  const { scriptRefs, toRefs } = findCrossFileReferences(databases);
  const crossFileRefs = scriptRefs; // backward compat
  const crossFileTableRefs = toRefs;

  return { databases, reverseRefs, crossFileRefs, crossFileTableRefs };
}

/**
 * Read file as text, handling encoding
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      let text = reader.result;
      // Handle UTF-16 encoding (common in FileMaker exports)
      if (text.charCodeAt(0) === 0xFFFE || text.charCodeAt(0) === 0xFEFF) {
        // Re-read as UTF-16
        const reader2 = new FileReader();
        reader2.onload = () => resolve(reader2.result);
        reader2.onerror = reject;
        reader2.readAsText(file, 'utf-16');
      } else {
        resolve(text);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Parse XML text into database schema object
 */
function parseXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('XML parse error:', parseError.textContent);
    return null;
  }
  
  const fileEl = doc.querySelector('FMPReport > File');
  if (!fileEl) {
    console.error('Invalid DDR XML: missing File element');
    return null;
  }
  
  const dbName = fileEl.getAttribute('name')?.replace('.fmp12', '') || 'Unknown';
  
  return {
    name: dbName,
    tables: parseTables(doc),
    tableOccurrences: parseTableOccurrences(doc),
    relationships: parseRelationships(doc),
    layouts: parseLayouts(doc),
    scripts: parseScripts(doc),
    valueLists: parseValueLists(doc),
    customFunctions: parseCustomFunctions(doc),
    accounts: parseAccounts(doc),
    privilegeSets: parsePrivilegeSets(doc),
    extendedPrivileges: parseExtendedPrivileges(doc),
  };
}

/**
 * Parse base tables and fields
 */
function parseTables(doc) {
  const tables = [];
  
  for (const tableEl of doc.querySelectorAll('BaseTableCatalog > BaseTable')) {
    const table = {
      id: tableEl.getAttribute('id'),
      name: tableEl.getAttribute('name'),
      records: tableEl.getAttribute('records') || '0',
      comment: tableEl.querySelector(':scope > Comment')?.textContent || '',
      fields: [],
    };
    
    for (const fieldEl of tableEl.querySelectorAll('FieldCatalog > Field')) {
      const field = parseField(fieldEl);
      table.fields.push(field);
    }
    
    table.fieldCount = table.fields.length;
    tables.push(table);
  }
  
  return tables;
}

/**
 * Parse individual field with all metadata
 */
function parseField(fieldEl) {
  const field = {
    id: fieldEl.getAttribute('id'),
    name: fieldEl.getAttribute('name'),
    dataType: fieldEl.getAttribute('dataType') || 'Text',
    fieldType: fieldEl.getAttribute('fieldType') || 'Normal',
    comment: fieldEl.querySelector(':scope > Comment')?.textContent || '',
  };
  
  // Storage options
  const storageEl = fieldEl.querySelector('Storage');
  if (storageEl) {
    field.global = storageEl.getAttribute('global') === 'True';
    const indexAttr = storageEl.getAttribute('index');
    field.indexed = indexAttr && indexAttr !== 'None';
    field.indexType = indexAttr;
    field.autoIndexed = storageEl.getAttribute('autoIndex') === 'True';
    const reps = parseInt(storageEl.getAttribute('maxRepetition') || '1');
    if (reps > 1) field.repetitions = reps;
    // Stored vs unstored calculations
    if (field.fieldType === 'Calculated' || field.fieldType === 'Summary') {
      field.storedCalculation = storageEl.getAttribute('storeCalculationResults') !== 'False';
    }
  }

  // Auto-enter options
  const autoEnterEl = fieldEl.querySelector('AutoEnter');
  if (autoEnterEl) {
    field.autoEnter = parseAutoEnter(autoEnterEl);
    field.autoEnterCalc = autoEnterEl.querySelector('Calculation')?.textContent;
    field.autoEnterOverwrite = autoEnterEl.getAttribute('overwriteExistingValue') === 'True';
    field.autoEnterAlwaysEvaluate = autoEnterEl.getAttribute('alwaysEvaluate') === 'True';
    field.autoEnterAllowEditing = autoEnterEl.getAttribute('allowEditing') !== 'False';
    // Lookup details
    const lookupEl = autoEnterEl.querySelector('Lookup');
    if (lookupEl) {
      const lookupTableEl = lookupEl.querySelector('Table');
      const lookupFieldEl = lookupEl.querySelector('Field');
      field.lookup = {
        table: lookupTableEl?.getAttribute('name') || '',
        field: lookupFieldEl ? `${lookupFieldEl.getAttribute('table') || ''}::${lookupFieldEl.getAttribute('name') || ''}` : '',
        noMatchOption: lookupEl.querySelector('NoMatchCopyOption')?.getAttribute('value') || '',
        copyEmpty: lookupEl.querySelector('CopyEmptyContent')?.getAttribute('value') === 'True',
      };
    }
  }

  // Validation options
  const validationEl = fieldEl.querySelector('Validation');
  if (validationEl) {
    field.validation = parseValidation(validationEl);
    field.validationCalc = validationEl.querySelector('Calculation')?.textContent;
    field.validationType = validationEl.getAttribute('type') || null;
    field.validationErrorMessage = validationEl.querySelector('ErrorMessage')?.textContent || null;
  }

  // Summary field info
  if (field.fieldType === 'Summary') {
    const summaryEl = fieldEl.querySelector('SummaryInfo');
    if (summaryEl) {
      field.summaryInfo = {
        operation: summaryEl.getAttribute('operation') || '',
        restartForEachSortedGroup: summaryEl.getAttribute('restartForEachSortedGroup') === 'True',
        summarizeRepetition: summaryEl.getAttribute('summarizeRepetition') || '',
        summaryField: summaryEl.querySelector('SummaryField > Field')?.getAttribute('name') || '',
      };
    }
  }

  // Calculation (for calculated fields)
  if (field.fieldType === 'Calculated') {
    const calcEl = fieldEl.querySelector(':scope > Calculation');
    if (calcEl) {
      field.calcText = calcEl.textContent;
      field.calcFieldRefs = extractFieldReferences(field.calcText);
      field.indirection = detectIndirection(field.calcText);
    }
  }

  // Also check auto-enter calcs for indirection
  if (field.autoEnterCalc) {
    field.autoEnterIndirection = detectIndirection(field.autoEnterCalc);
  }

  return field;
}

/**
 * Parse field-level script triggers from layout fields
 * This is called during layout parsing to associate triggers with fields
 */
function parseFieldTriggers(fieldObjEl) {
  const triggers = [];
  for (const triggerEl of fieldObjEl.querySelectorAll('ScriptTriggers > Trigger')) {
    const scriptEl = triggerEl.querySelector('Script');
    if (scriptEl) {
      triggers.push({
        type: triggerEl.getAttribute('event') || triggerEl.getAttribute('type'),
        script: scriptEl.getAttribute('name'),
      });
    }
  }
  return triggers;
}

/**
 * Parse auto-enter options into summary string
 */
function parseAutoEnter(el) {
  const parts = [];
  
  if (el.querySelector('Serial')) parts.push('Serial');
  if (el.querySelector('CreationTimestamp[value="True"]')) parts.push('CreationTS');
  if (el.querySelector('CreationAccountName[value="True"]')) parts.push('CreationAcct');
  if (el.querySelector('ModificationTimestamp[value="True"]')) parts.push('ModificationTS');
  if (el.querySelector('ModificationAccountName[value="True"]')) parts.push('ModificationAcct');
  if (el.getAttribute('calculation') === 'True') parts.push('Calc');
  if (el.getAttribute('lookup') === 'True') parts.push('Lookup');
  if (el.querySelector('ConstantData')) parts.push('Constant');
  
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Parse validation options into summary string
 */
function parseValidation(el) {
  const parts = [];
  
  if (el.getAttribute('notEmpty') === 'True') parts.push('Required');
  if (el.getAttribute('unique') === 'True') parts.push('Unique');
  if (el.getAttribute('existing') === 'True') parts.push('Existing');
  
  const vlEl = el.querySelector('ValueList');
  if (vlEl) parts.push(`VL:${vlEl.getAttribute('name')}`);
  
  const rangeEl = el.querySelector('Range');
  if (rangeEl) {
    const lower = rangeEl.querySelector('LowerBound')?.getAttribute('value');
    const upper = rangeEl.querySelector('UpperBound')?.getAttribute('value');
    if (lower || upper) parts.push(`Range:${lower || ''}–${upper || ''}`);
  }
  
  const maxLen = el.getAttribute('maxLength');
  if (maxLen) parts.push(`MaxLen:${maxLen}`);
  
  if (el.querySelector('Calculation')) parts.push('CalcValidation');
  
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Parse table occurrences
 */
function parseTableOccurrences(doc) {
  const tos = [];
  
  // TOs are in RelationshipGraph/TableList/Table (not TableOccurrence!)
  for (const toEl of doc.querySelectorAll('RelationshipGraph > TableList > Table')) {
    const to = {
      id: toEl.getAttribute('id'),
      name: toEl.getAttribute('name'),
      baseTable: toEl.getAttribute('basetable'),
    };
    
    // Check for external file reference (shadow TO)
    const fileRef = toEl.querySelector('FileReference');
    if (fileRef) {
      to.externalFile = fileRef.getAttribute('name');
    }
    
    tos.push(to);
  }
  
  return tos;
}

/**
 * Parse relationships
 */
function parseRelationships(doc) {
  const rels = [];

  for (const relEl of doc.querySelectorAll('RelationshipGraph > RelationshipList > Relationship')) {
    const leftTableEl = relEl.querySelector('LeftTable');
    const rightTableEl = relEl.querySelector('RightTable');

    const parseSortList = (tableEl) => {
      const sorts = [];
      const sortListEl = tableEl?.querySelector('SortList');
      if (sortListEl && sortListEl.getAttribute('value') === 'True') {
        for (const sortEl of sortListEl.querySelectorAll('Sort')) {
          const fieldEl = sortEl.querySelector('PrimaryField > Field');
          sorts.push({
            field: fieldEl?.getAttribute('name') || '',
            table: fieldEl?.getAttribute('table') || '',
            direction: sortEl.getAttribute('type') || 'Ascending',
          });
        }
      }
      return sorts;
    };

    const rel = {
      id: relEl.getAttribute('id'),
      leftTable: leftTableEl?.getAttribute('name'),
      rightTable: rightTableEl?.getAttribute('name'),
      leftCascadeCreate: leftTableEl?.getAttribute('cascadeCreate') === 'True',
      leftCascadeDelete: leftTableEl?.getAttribute('cascadeDelete') === 'True',
      rightCascadeCreate: rightTableEl?.getAttribute('cascadeCreate') === 'True',
      rightCascadeDelete: rightTableEl?.getAttribute('cascadeDelete') === 'True',
      leftSort: parseSortList(leftTableEl),
      rightSort: parseSortList(rightTableEl),
      predicates: [],
    };

    for (const predEl of relEl.querySelectorAll('JoinPredicateList > JoinPredicate')) {
      const pred = {
        type: predEl.getAttribute('type') || 'Equal',
        leftField: predEl.querySelector('LeftField > Field')?.getAttribute('name') || predEl.querySelector('LeftField')?.getAttribute('name'),
        rightField: predEl.querySelector('RightField > Field')?.getAttribute('name') || predEl.querySelector('RightField')?.getAttribute('name'),
        cascadeCreate: predEl.getAttribute('cascade_create') === 'True',
        cascadeDelete: predEl.getAttribute('cascade_delete') === 'True',
      };
      rel.predicates.push(pred);
    }

    rels.push(rel);
  }

  return rels;
}

/**
 * Parse layouts
 */
function parseLayouts(doc) {
  const layouts = [];

  for (const layoutEl of doc.querySelectorAll('LayoutCatalog > Layout')) {
    const layout = {
      id: layoutEl.getAttribute('id'),
      name: layoutEl.getAttribute('name'),
      baseTable: layoutEl.querySelector(':scope > Table')?.getAttribute('name'),
      triggers: [],
      buttonScripts: [],
      fields: [],
      fieldTriggers: [], // Field-level script triggers
    };

    // Layout-level script triggers
    for (const triggerEl of layoutEl.querySelectorAll(':scope > ScriptTriggers > Trigger')) {
      const scriptEl = triggerEl.querySelector('Script');
      if (scriptEl) {
        layout.triggers.push({
          type: triggerEl.getAttribute('event') || triggerEl.getAttribute('type'),
          script: scriptEl.getAttribute('name'),
          level: 'layout',
        });
      }
    }

    // Button scripts
    for (const buttonEl of layoutEl.querySelectorAll('Object[type="Button"] ButtonObj Step Script')) {
      const scriptName = buttonEl.getAttribute('name');
      if (scriptName && !layout.buttonScripts.includes(scriptName)) {
        layout.buttonScripts.push(scriptName);
      }
    }

    // Fields on layout with their triggers
    for (const fieldObjEl of layoutEl.querySelectorAll('Object[type="Field"]')) {
      const fieldInfo = fieldObjEl.querySelector('FieldObj DDRInfo Field');
      if (!fieldInfo) continue;

      const tableName = fieldInfo.getAttribute('table');
      const fieldName = fieldInfo.getAttribute('name');
      if (!tableName || !fieldName) continue;

      const ref = `${tableName}::${fieldName}`;
      if (!layout.fields.includes(ref)) {
        layout.fields.push(ref);
      }

      // Parse field-level script triggers
      for (const triggerEl of fieldObjEl.querySelectorAll('ScriptTriggers > Trigger')) {
        const scriptEl = triggerEl.querySelector('Script');
        if (scriptEl) {
          const triggerType = triggerEl.getAttribute('event') || triggerEl.getAttribute('type');
          layout.fieldTriggers.push({
            field: ref,
            type: triggerType,
            script: scriptEl.getAttribute('name'),
          });
          // Also add to main triggers list for script tracking
          layout.triggers.push({
            type: triggerType,
            script: scriptEl.getAttribute('name'),
            level: 'field',
            field: ref,
          });
        }
      }
    }

    layouts.push(layout);
  }

  return layouts;
}

/**
 * Parse scripts (handles nested folders)
 */
function parseScripts(doc) {
  const scripts = [];
  const catalog = doc.querySelector('ScriptCatalog');
  if (!catalog) return scripts;
  
  function parseScriptElement(el, folderPath = '') {
    for (const child of el.children) {
      if (child.tagName === 'Group') {
        // Folder - recurse
        const folderName = child.getAttribute('name');
        const newPath = folderPath ? `${folderPath}/${folderName}` : folderName;
        parseScriptElement(child, newPath);
      } else if (child.tagName === 'Script') {
        const script = parseScript(child, folderPath);
        scripts.push(script);
      }
    }
  }
  
  parseScriptElement(catalog);
  return scripts;
}

/**
 * Parse individual script
 */
function parseScript(scriptEl, folder) {
  const script = {
    id: scriptEl.getAttribute('id'),
    name: scriptEl.getAttribute('name'),
    folder: folder || null,
    includeInMenu: scriptEl.getAttribute('includeInMenu') === 'True',
    runFullAccess: scriptEl.getAttribute('runFullAccessPrivileges') === 'True',
    steps: [],
    callsScripts: [],
    goesToLayouts: [],
    fieldRefs: [],
    variables: [],
    indirection: [], // ExecuteSQL, Evaluate, etc.
  };
  
  // Parse steps
  let stepIndex = 0;
  for (const stepEl of scriptEl.querySelectorAll('StepList > Step')) {
    stepIndex++;
    const stepName = stepEl.getAttribute('name') || '';
    const step = {
      index: stepEl.getAttribute('index') || stepIndex,
      id: stepEl.getAttribute('id'),
      name: stepName,
      enabled: stepEl.getAttribute('enable') !== 'False',
      text: stepEl.querySelector('StepText')?.textContent || '',
    };

    // Get calculation if present
    const calcEl = stepEl.querySelector('Calculation');
    if (calcEl) {
      step.calculation = calcEl.textContent?.trim() || '';
    }

    // Get target field for Set Field, Insert Calculated Result, etc.
    const targetField = stepEl.querySelector('Field[table]');
    if (targetField) {
      step.targetField = `${targetField.getAttribute('table')}::${targetField.getAttribute('name')}`;
    }

    // Get table reference
    const tableEl = stepEl.querySelector('Table');
    if (tableEl) {
      step.table = tableEl.getAttribute('name');
    }

    // Perform Script
    const perfScriptEl = stepEl.querySelector('Script');
    if (perfScriptEl && stepName.includes('Script')) {
      const fileRef = stepEl.querySelector('FileReference');
      const scriptName = perfScriptEl.getAttribute('name');
      if (fileRef) {
        script.callsScripts.push({
          name: scriptName,
          file: fileRef.getAttribute('name'),
          external: true,
        });
        step.scriptRef = scriptName;
        step.externalFile = fileRef.getAttribute('name');
      } else {
        script.callsScripts.push({
          name: scriptName,
          external: false,
        });
        step.scriptRef = scriptName;
      }
    }

    // Go to Layout
    const layoutEl = stepEl.querySelector('Layout');
    if (layoutEl && stepName.includes('Layout')) {
      const layoutName = layoutEl.getAttribute('name');
      if (layoutName && !script.goesToLayouts.includes(layoutName)) {
        script.goesToLayouts.push(layoutName);
      }
      step.layoutRef = layoutName;
    }

    // Go to Record/Request/Page
    if (stepName.includes('Go to Record')) {
      const calcText = calcEl?.textContent || '';
      step.recordAction = stepEl.querySelector('Calculation') ? 'By Calculation' :
        stepEl.querySelector('First')?.getAttribute('state') === 'True' ? 'First' :
        stepEl.querySelector('Last')?.getAttribute('state') === 'True' ? 'Last' :
        stepEl.querySelector('Next')?.getAttribute('state') === 'True' ? 'Next' :
        stepEl.querySelector('Previous')?.getAttribute('state') === 'True' ? 'Previous' : 'Unknown';
    }

    // Set Variable
    if (stepName === 'Set Variable') {
      const varName = stepEl.querySelector('Name > Calculation')?.textContent ||
                      stepEl.querySelector('Text')?.textContent;
      if (varName) {
        step.variableName = varName.trim();
        if (!script.variables.includes(varName.trim())) {
          script.variables.push(varName.trim());
        }
      }
      const repetition = stepEl.querySelector('Repetition > Calculation')?.textContent;
      if (repetition) {
        step.repetition = repetition.trim();
      }
    }

    // If/Else If condition
    if (stepName === 'If' || stepName === 'Else If') {
      step.condition = calcEl?.textContent?.trim() || '';
    }

    // Loop
    if (stepName === 'Loop') {
      // Check for flush option
      step.flushAfter = stepEl.querySelector('Flush')?.getAttribute('state') === 'True';
    }

    // Exit Loop If
    if (stepName === 'Exit Loop If') {
      step.condition = calcEl?.textContent?.trim() || '';
    }

    // Commit/Revert
    if (stepName.includes('Commit') || stepName.includes('Revert')) {
      step.skipValidation = stepEl.querySelector('NoDialog')?.getAttribute('state') === 'True' ||
                            stepEl.querySelector('SkipValidation')?.getAttribute('state') === 'True';
    }

    // New Window / New Record options
    if (stepName === 'New Window') {
      step.windowName = stepEl.querySelector('Name > Calculation')?.textContent?.trim();
      step.windowStyle = stepEl.querySelector('Style')?.textContent;
    }

    // Show Custom Dialog
    if (stepName === 'Show Custom Dialog') {
      step.title = stepEl.querySelector('Title > Calculation')?.textContent?.trim();
      step.message = stepEl.querySelector('Message > Calculation')?.textContent?.trim();
      // Count input fields
      const inputFields = stepEl.querySelectorAll('InputField');
      if (inputFields.length > 0) {
        step.inputFieldCount = inputFields.length;
      }
      // Count buttons
      const buttons = stepEl.querySelectorAll('Button');
      if (buttons.length > 0) {
        step.buttonCount = buttons.length;
      }
    }

    // Insert From URL / Send Event
    if (stepName.includes('URL') || stepName === 'Send Event') {
      step.url = stepEl.querySelector('URL > Calculation')?.textContent?.trim() ||
                 stepEl.querySelector('Calculation')?.textContent?.trim();
    }

    // Open URL
    if (stepName === 'Open URL') {
      step.url = stepEl.querySelector('Calculation')?.textContent?.trim();
    }

    // Sort Records
    if (stepName === 'Sort Records') {
      const sortFields = stepEl.querySelectorAll('SortList > Sort');
      if (sortFields.length > 0) {
        step.sortFields = Array.from(sortFields).map(s => {
          const f = s.querySelector('Field');
          return f ? `${f.getAttribute('table')}::${f.getAttribute('name')}` : 'Unknown';
        });
      }
    }

    // Collect all field references
    for (const fieldEl of stepEl.querySelectorAll('Field[table]')) {
      const tableName = fieldEl.getAttribute('table');
      const fieldName = fieldEl.getAttribute('name');
      if (tableName && fieldName) {
        const ref = `${tableName}::${fieldName}`;
        if (!script.fieldRefs.includes(ref)) {
          script.fieldRefs.push(ref);
        }
      }
    }

    // Extract field references from calculations
    if (calcEl) {
      const calcText = calcEl.textContent;
      const refs = extractFieldReferences(calcText);
      for (const ref of refs) {
        if (!script.fieldRefs.includes(ref)) {
          script.fieldRefs.push(ref);
        }
      }

      // Detect indirection patterns
      const indirectionPatterns = detectIndirection(calcText);
      for (const pattern of indirectionPatterns) {
        if (!script.indirection.find(i => i.type === pattern.type)) {
          script.indirection.push({ ...pattern, step: step.index || script.steps.length + 1 });
        }
      }
    }

    script.steps.push(step);
  }
  
  script.stepCount = script.steps.length;
  return script;
}

/**
 * Parse value lists
 */
function parseValueLists(doc) {
  const vls = [];

  for (const vlEl of doc.querySelectorAll('ValueListCatalog > ValueList')) {
    const sourceEl = vlEl.querySelector('Source');
    const sourceType = sourceEl?.getAttribute('value') || null;

    const vl = {
      id: vlEl.getAttribute('id'),
      name: vlEl.getAttribute('name'),
      type: 'custom', // default, overridden below
      values: [],
      sourceField: null,
      primaryField: null,
      secondaryField: null,
      showRelated: null,
      external: null,
    };

    // Custom values - DDR XML stores these as newline-separated text in a <Text> element
    const customValuesText = vlEl.querySelector('CustomValues > Text')?.textContent;
    if (customValuesText) {
      vl.values = customValuesText.split(/\r?\n/).filter(v => v.length > 0);
    }

    if (sourceType === 'External') {
      // External value list from another file
      vl.type = 'external';
      const extEl = vlEl.querySelector('External');
      if (extEl) {
        const fileRefEl = extEl.querySelector('FileReference');
        const extVlEl = extEl.querySelector('ValueList');
        vl.external = {
          fileName: fileRefEl?.getAttribute('name') || '',
          valueListName: extVlEl?.getAttribute('name') || '',
          valueListId: extVlEl?.getAttribute('id') || '',
        };
      }
    } else if (sourceType === 'Field' || vlEl.querySelector('PrimaryField')) {
      // Field-based value list — check Source attribute first, then PrimaryField element
      vl.type = 'field';
      const primaryFieldEl = vlEl.querySelector('PrimaryField');
      if (primaryFieldEl) {
        const fieldEl = primaryFieldEl.querySelector('Field');
        vl.primaryField = {
          table: fieldEl?.getAttribute('table') || '',
          name: fieldEl?.getAttribute('name') || '',
          show: primaryFieldEl.getAttribute('show') !== 'False',
          sort: primaryFieldEl.getAttribute('sort') === 'True',
        };
        vl.sourceField = `${vl.primaryField.table}::${vl.primaryField.name}`;

        // Secondary field
        const secondaryFieldEl = vlEl.querySelector('SecondaryField');
        if (secondaryFieldEl) {
          const secFieldEl = secondaryFieldEl.querySelector('Field');
          if (secFieldEl) {
            vl.secondaryField = {
              table: secFieldEl.getAttribute('table') || '',
              name: secFieldEl.getAttribute('name') || '',
              show: secondaryFieldEl.getAttribute('show') === 'True',
              sort: secondaryFieldEl.getAttribute('sort') === 'True',
            };
          }
        }

        // Show related values
        const showRelatedEl = vlEl.querySelector('ShowRelated');
        if (showRelatedEl && showRelatedEl.getAttribute('value') === 'True') {
          const relTableEl = showRelatedEl.querySelector('Table');
          vl.showRelated = {
            table: relTableEl?.getAttribute('name') || '',
          };
        }
      }
    } else {
      // Custom values only
      vl.type = 'custom';
    }

    vls.push(vl);
  }

  return vls;
}

/**
 * Parse custom functions
 */
function parseCustomFunctions(doc) {
  const cfs = [];

  for (const cfEl of doc.querySelectorAll('CustomFunctionCatalog > CustomFunction')) {
    // Parameters can be an attribute or a child element depending on DDR version
    const paramsRaw = cfEl.getAttribute('parameters') || cfEl.querySelector('Parameters')?.textContent || '';
    const cf = {
      id: cfEl.getAttribute('id'),
      name: cfEl.getAttribute('name'),
      parameters: paramsRaw,
      parameterList: paramsRaw ? paramsRaw.split(/\s*;\s*/).filter(p => p.length > 0) : [],
      calculation: cfEl.querySelector('Calculation')?.textContent || '',
      visible: cfEl.getAttribute('visible') !== 'False',
      arity: parseInt(cfEl.getAttribute('functionArity'), 10) || 0,
    };
    cfs.push(cf);
  }

  return cfs;
}

/**
 * Parse accounts
 */
function parseAccounts(doc) {
  const accounts = [];

  for (const acctEl of doc.querySelectorAll('AccountCatalog > Account')) {
    const account = {
      id: acctEl.getAttribute('id'),
      name: acctEl.getAttribute('name'),
      status: acctEl.getAttribute('status') || 'Active',
      privilegeSet: acctEl.getAttribute('privilegeSet'),
      managedBy: acctEl.getAttribute('managedBy') || 'FileMaker',
      emptyPassword: acctEl.hasAttribute('emptyPassword') ? acctEl.getAttribute('emptyPassword') === 'True' : null,
      changePasswordOnNextLogin: acctEl.hasAttribute('changePasswordOnNextLogin') ? acctEl.getAttribute('changePasswordOnNextLogin') === 'True' : null,
      description: acctEl.querySelector('Description')?.textContent || '',
    };
    accounts.push(account);
  }

  return accounts;
}

/**
 * Parse privilege sets
 */
function parsePrivilegeSets(doc) {
  const sets = [];

  for (const psEl of doc.querySelectorAll('PrivilegesCatalog > PrivilegeSet, PrivilegeSetCatalog > PrivilegeSet')) {
    const ps = {
      id: psEl.getAttribute('id'),
      name: psEl.getAttribute('name'),
      comment: psEl.getAttribute('comment') || '',
      // Access permissions
      printing: psEl.getAttribute('printing') === 'True',
      exporting: psEl.getAttribute('exporting') === 'True',
      manageAccounts: psEl.getAttribute('manageAccounts') === 'True',
      allowModifyPassword: psEl.getAttribute('allowModifyPassword') === 'True',
      overrideValidationWarning: psEl.getAttribute('overrideValidationWarning') === 'True',
      idleDisconnect: psEl.getAttribute('idleDisconnect') === 'True',
      menu: psEl.getAttribute('menu') || 'All',
      // Password policy
      passwordExpiry: psEl.getAttribute('passwordExpiry') || '',
      passwordMinLength: psEl.getAttribute('passwordMinLength') || '',
      // Record/layout/script access
      records: psEl.querySelector('Records')?.getAttribute('value') || 'NoAccess',
      layouts: psEl.querySelector('Layouts')?.getAttribute('value') || 'NoAccess',
      layoutCreation: psEl.querySelector('Layouts')?.getAttribute('allowCreation') === 'True',
      scripts: psEl.querySelector('Scripts')?.getAttribute('value') || 'NoAccess',
      scriptCreation: psEl.querySelector('Scripts')?.getAttribute('allowCreation') === 'True',
      valueLists: psEl.querySelector('ValueLists')?.getAttribute('value') || 'NoAccess',
      valueListCreation: psEl.querySelector('ValueLists')?.getAttribute('allowCreation') === 'True',
    };
    sets.push(ps);
  }

  return sets;
}

/**
 * Parse extended privileges
 */
function parseExtendedPrivileges(doc) {
  const eps = [];

  for (const epEl of doc.querySelectorAll('ExtendedPrivilegeCatalog > ExtendedPrivilege')) {
    const ep = {
      id: epEl.getAttribute('id'),
      name: epEl.getAttribute('name'),
      comment: epEl.getAttribute('comment') || '',
      privilegeSets: [],
    };

    // Get assigned privilege sets
    for (const psEl of epEl.querySelectorAll('PrivilegeSetList > PrivilegeSet')) {
      ep.privilegeSets.push(psEl.getAttribute('name'));
    }

    eps.push(ep);
  }

  return eps;
}

/**
 * Extract field references from calculation text
 * Matches patterns like: TableOccurrence::FieldName or TableOccurrence::"Field Name"
 */
function extractFieldReferences(calcText) {
  if (!calcText) return [];

  const refs = [];
  // Match TO::Field or TO::"Field Name"
  const regex = /([A-Za-z_][A-Za-z0-9_ ]*)::(\"[^\"]+\"|[A-Za-z_][A-Za-z0-9_]*)/g;
  let match;

  while ((match = regex.exec(calcText)) !== null) {
    let fieldName = match[2];
    // Remove quotes if present
    if (fieldName.startsWith('"') && fieldName.endsWith('"')) {
      fieldName = fieldName.slice(1, -1);
    }
    const ref = `${match[1]}::${fieldName}`;
    if (!refs.includes(ref)) {
      refs.push(ref);
    }
  }

  return refs;
}

/**
 * Detect indirection patterns in calculation text
 */
function detectIndirection(calcText) {
  if (!calcText) return [];

  const patterns = [];
  const text = calcText.toLowerCase();

  if (text.includes('executesql')) {
    patterns.push({ type: 'ExecuteSQL', description: 'Direct SQL query execution' });
  }
  if (text.includes('evaluate(')) {
    patterns.push({ type: 'Evaluate', description: 'Dynamic calculation evaluation' });
  }
  if (text.includes('getvalue(') || text.includes('valuetable')) {
    patterns.push({ type: 'GetValue', description: 'Dynamic value list access' });
  }
  if (/\$[a-z_]/i.test(calcText) && (text.includes('perform script') || text.includes('go to layout'))) {
    patterns.push({ type: 'DynamicReference', description: 'Variable-based navigation' });
  }

  return patterns;
}

/**
 * Build reverse reference indexes across all databases
 */
function buildReverseReferences(databases) {
  const refs = {
    scriptCallers: {},      // script -> scripts that call it
    scriptOnLayouts: {},    // script -> layouts with buttons/triggers for it
    fieldInScripts: {},     // field -> scripts that reference it
    fieldOnLayouts: {},     // field -> layouts that display it
    fieldInCalcs: {},       // field -> calc fields that reference it
    layoutFromScripts: {},  // layout -> scripts that navigate to it
    toLayouts: {},          // TO -> layouts based on it
    toRelationships: {},    // TO -> relationships involving it
  };
  
  for (const db of databases) {
    const dbName = db.name;
    
    // Script callers and field references
    for (const script of db.scripts || []) {
      // Scripts this script calls
      for (const called of script.callsScripts || []) {
        if (!called.external) {
          if (!refs.scriptCallers[called.name]) refs.scriptCallers[called.name] = [];
          refs.scriptCallers[called.name].push({ script: script.name, db: dbName });
        }
      }
      
      // Layouts this script goes to
      for (const layout of script.goesToLayouts || []) {
        if (!refs.layoutFromScripts[layout]) refs.layoutFromScripts[layout] = [];
        refs.layoutFromScripts[layout].push({ script: script.name, db: dbName });
      }
      
      // Fields this script references
      for (const fieldRef of script.fieldRefs || []) {
        if (!refs.fieldInScripts[fieldRef]) refs.fieldInScripts[fieldRef] = [];
        refs.fieldInScripts[fieldRef].push({ script: script.name, db: dbName });
      }
    }
    
    // Layout references
    for (const layout of db.layouts || []) {
      // Scripts on this layout
      const allScripts = [
        ...(layout.triggers || []).map(t => t.script),
        ...(layout.buttonScripts || [])
      ];
      for (const scriptName of allScripts) {
        if (!refs.scriptOnLayouts[scriptName]) refs.scriptOnLayouts[scriptName] = [];
        if (!refs.scriptOnLayouts[scriptName].find(r => r.layout === layout.name && r.db === dbName)) {
          refs.scriptOnLayouts[scriptName].push({ layout: layout.name, db: dbName });
        }
      }
      
      // Fields on this layout
      for (const fieldRef of layout.fields || []) {
        if (!refs.fieldOnLayouts[fieldRef]) refs.fieldOnLayouts[fieldRef] = [];
        refs.fieldOnLayouts[fieldRef].push({ layout: layout.name, db: dbName });
      }
      
      // TO for this layout
      if (layout.baseTable) {
        if (!refs.toLayouts[layout.baseTable]) refs.toLayouts[layout.baseTable] = [];
        refs.toLayouts[layout.baseTable].push({ layout: layout.name, db: dbName });
      }
    }
    
    // Relationship TO references
    for (const rel of db.relationships || []) {
      if (rel.leftTable) {
        if (!refs.toRelationships[rel.leftTable]) refs.toRelationships[rel.leftTable] = [];
        refs.toRelationships[rel.leftTable].push({ relationship: rel.id, side: 'left', db: dbName });
      }
      if (rel.rightTable) {
        if (!refs.toRelationships[rel.rightTable]) refs.toRelationships[rel.rightTable] = [];
        refs.toRelationships[rel.rightTable].push({ relationship: rel.id, side: 'right', db: dbName });
      }
    }
    
    // Field references in calculations
    for (const table of db.tables || []) {
      for (const field of table.fields || []) {
        if (field.calcFieldRefs) {
          for (const ref of field.calcFieldRefs) {
            if (!refs.fieldInCalcs[ref]) refs.fieldInCalcs[ref] = [];
            refs.fieldInCalcs[ref].push({ table: table.name, field: field.name, db: dbName });
          }
        }
      }
    }
  }
  
  return refs;
}

/**
 * Find cross-file references (scripts and table occurrences)
 */
function findCrossFileReferences(databases) {
  const scriptRefs = [];
  const toRefs = [];

  for (const db of databases) {
    // Cross-file script calls
    for (const script of db.scripts || []) {
      for (const called of script.callsScripts || []) {
        if (called.external) {
          scriptRefs.push({
            sourceDb: db.name,
            sourceScript: script.name,
            targetDb: called.file,
            targetScript: called.name,
          });
        }
      }
    }

    // Cross-file table occurrences (shadow TOs)
    for (const to of db.tableOccurrences || []) {
      if (to.externalFile) {
        toRefs.push({
          toName: to.name,
          toDb: db.name,
          baseTable: to.baseTable,
          externalFile: to.externalFile,
        });
      }
    }
  }

  return { scriptRefs, toRefs };
}

/**
 * Analyze databases for orphans, security issues, indirection, and complexity
 */
export function analyzeDatabase(data) {
  const { databases, reverseRefs } = data;

  const analysis = {
    orphans: findOrphans(databases, reverseRefs),
    security: findSecurityIssues(databases),
    indirection: findIndirectionSources(databases),
    complexity: calculateComplexity(databases),
    fieldUsage: analyzeFieldUsage(databases, reverseRefs),
    performance: analyzePerformance(databases),
  };

  return analysis;
}

/**
 * Find unused/orphaned elements
 */
function findOrphans(databases, reverseRefs) {
  const orphans = {
    scripts: [],
    fields: [],
    layouts: [],
    tableOccurrences: [],
    customFunctions: [],
    valueLists: [],
  };

  for (const db of databases) {
    // Orphan scripts - not called by any script, not on any layout
    for (const script of db.scripts || []) {
      const callers = reverseRefs.scriptCallers?.[script.name] || [];
      const onLayouts = reverseRefs.scriptOnLayouts?.[script.name] || [];
      if (callers.length === 0 && onLayouts.length === 0) {
        orphans.scripts.push({ name: script.name, db: db.name, folder: script.folder });
      }
    }

    // Orphan layouts - no script navigates to them
    for (const layout of db.layouts || []) {
      const fromScripts = reverseRefs.layoutFromScripts?.[layout.name] || [];
      // Special layouts like "Layout #1" or utility layouts might be OK
      if (fromScripts.length === 0 && !layout.name.startsWith('-')) {
        orphans.layouts.push({ name: layout.name, db: db.name, baseTable: layout.baseTable });
      }
    }

    // Orphan TOs - no layouts use them, no relationships
    for (const to of db.tableOccurrences || []) {
      const layouts = reverseRefs.toLayouts?.[to.name] || [];
      const rels = reverseRefs.toRelationships?.[to.name] || [];
      if (layouts.length === 0 && rels.length === 0) {
        orphans.tableOccurrences.push({ name: to.name, db: db.name, baseTable: to.baseTable });
      }
    }

    // Orphan fields - not on layouts, not in scripts, not in calcs
    for (const table of db.tables || []) {
      for (const field of table.fields || []) {
        const fieldKey = `${table.name}::${field.name}`;
        const inScripts = reverseRefs.fieldInScripts?.[fieldKey] || [];
        const onLayouts = reverseRefs.fieldOnLayouts?.[fieldKey] || [];
        const inCalcs = reverseRefs.fieldInCalcs?.[fieldKey] || [];

        // Skip common system fields
        const systemFields = ['id', 'uuid', 'created', 'modified', 'createdby', 'modifiedby'];
        const isSystem = systemFields.some(sf => field.name.toLowerCase().includes(sf));

        if (!isSystem && inScripts.length === 0 && onLayouts.length === 0 && inCalcs.length === 0) {
          orphans.fields.push({
            name: field.name,
            table: table.name,
            db: db.name,
            dataType: field.dataType,
            fieldType: field.fieldType,
          });
        }
      }
    }

    // Orphan custom functions - check if used in any calc
    for (const cf of db.customFunctions || []) {
      let isUsed = false;
      const cfName = cf.name.toLowerCase();

      // Check all calculations for usage
      for (const table of db.tables || []) {
        for (const field of table.fields || []) {
          if (field.calcText?.toLowerCase().includes(cfName)) {
            isUsed = true;
            break;
          }
        }
        if (isUsed) break;
      }

      if (!isUsed) {
        for (const script of db.scripts || []) {
          for (const step of script.steps || []) {
            // Would need to check step calculations...simplified check
          }
        }
      }

      if (!isUsed) {
        orphans.customFunctions.push({ name: cf.name, db: db.name });
      }
    }
  }

  return orphans;
}

/**
 * Find security issues
 */
function findSecurityIssues(databases) {
  const issues = {
    fullAccessScripts: [],
    unrestrictedScripts: [], // Scripts in menu but run full access
    totalFullAccess: 0,
  };

  for (const db of databases) {
    for (const script of db.scripts || []) {
      if (script.runFullAccess) {
        issues.fullAccessScripts.push({
          name: script.name,
          db: db.name,
          folder: script.folder,
          inMenu: script.includeInMenu,
        });
        issues.totalFullAccess++;

        // Extra concern: full access + in menu
        if (script.includeInMenu) {
          issues.unrestrictedScripts.push({
            name: script.name,
            db: db.name,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Find sources of indirection (ExecuteSQL, Evaluate, dynamic references)
 */
function findIndirectionSources(databases) {
  const sources = {
    executeSQL: [],
    evaluate: [],
    dynamicRefs: [],
    byType: {},
  };

  for (const db of databases) {
    // Check scripts
    for (const script of db.scripts || []) {
      for (const ind of script.indirection || []) {
        const entry = {
          location: 'script',
          script: script.name,
          db: db.name,
          step: ind.step,
          type: ind.type,
        };

        if (ind.type === 'ExecuteSQL') sources.executeSQL.push(entry);
        else if (ind.type === 'Evaluate') sources.evaluate.push(entry);
        else sources.dynamicRefs.push(entry);

        if (!sources.byType[ind.type]) sources.byType[ind.type] = [];
        sources.byType[ind.type].push(entry);
      }
    }

    // Check calculated fields
    for (const table of db.tables || []) {
      for (const field of table.fields || []) {
        for (const ind of field.indirection || []) {
          const entry = {
            location: 'field',
            table: table.name,
            field: field.name,
            db: db.name,
            type: ind.type,
          };

          if (ind.type === 'ExecuteSQL') sources.executeSQL.push(entry);
          else if (ind.type === 'Evaluate') sources.evaluate.push(entry);
          else sources.dynamicRefs.push(entry);

          if (!sources.byType[ind.type]) sources.byType[ind.type] = [];
          sources.byType[ind.type].push(entry);
        }

        // Auto-enter indirection
        for (const ind of field.autoEnterIndirection || []) {
          const entry = {
            location: 'auto-enter',
            table: table.name,
            field: field.name,
            db: db.name,
            type: ind.type,
          };

          if (!sources.byType[ind.type]) sources.byType[ind.type] = [];
          sources.byType[ind.type].push(entry);
        }
      }
    }
  }

  return sources;
}

/**
 * Calculate complexity metrics for report card
 */
function calculateComplexity(databases) {
  const metrics = {
    totals: {
      databases: databases.length,
      tables: 0,
      fields: 0,
      calcFields: 0,
      tableOccurrences: 0,
      relationships: 0,
      layouts: 0,
      scripts: 0,
      scriptSteps: 0,
      valueLists: 0,
      customFunctions: 0,
    },
    averages: {},
    complexity: {
      score: 0,
      level: 'Low',
      factors: [],
    },
    perDb: [],
  };

  for (const db of databases) {
    const dbMetrics = {
      name: db.name,
      tables: db.tables?.length || 0,
      fields: 0,
      calcFields: 0,
      tos: db.tableOccurrences?.length || 0,
      rels: db.relationships?.length || 0,
      layouts: db.layouts?.length || 0,
      scripts: db.scripts?.length || 0,
      scriptSteps: 0,
      vls: db.valueLists?.length || 0,
      cfs: db.customFunctions?.length || 0,
      avgFieldsPerTable: 0,
      avgStepsPerScript: 0,
    };

    // Count fields and calc fields
    for (const table of db.tables || []) {
      dbMetrics.fields += table.fields?.length || 0;
      for (const field of table.fields || []) {
        if (field.fieldType === 'Calculated') dbMetrics.calcFields++;
      }
    }

    // Count script steps
    for (const script of db.scripts || []) {
      dbMetrics.scriptSteps += script.steps?.length || 0;
    }

    // Calculate averages
    dbMetrics.avgFieldsPerTable = dbMetrics.tables > 0 ? Math.round(dbMetrics.fields / dbMetrics.tables) : 0;
    dbMetrics.avgStepsPerScript = dbMetrics.scripts > 0 ? Math.round(dbMetrics.scriptSteps / dbMetrics.scripts) : 0;

    // Add to totals
    metrics.totals.tables += dbMetrics.tables;
    metrics.totals.fields += dbMetrics.fields;
    metrics.totals.calcFields += dbMetrics.calcFields;
    metrics.totals.tableOccurrences += dbMetrics.tos;
    metrics.totals.relationships += dbMetrics.rels;
    metrics.totals.layouts += dbMetrics.layouts;
    metrics.totals.scripts += dbMetrics.scripts;
    metrics.totals.scriptSteps += dbMetrics.scriptSteps;
    metrics.totals.valueLists += dbMetrics.vls;
    metrics.totals.customFunctions += dbMetrics.cfs;

    metrics.perDb.push(dbMetrics);
  }

  // Calculate averages
  const numDbs = databases.length || 1;
  metrics.averages = {
    tablesPerDb: Math.round(metrics.totals.tables / numDbs),
    fieldsPerDb: Math.round(metrics.totals.fields / numDbs),
    scriptsPerDb: Math.round(metrics.totals.scripts / numDbs),
    layoutsPerDb: Math.round(metrics.totals.layouts / numDbs),
  };

  // Calculate complexity score (0-100)
  let score = 0;
  const factors = [];

  // Factor: Number of tables (0-15 points)
  const tableFactor = Math.min(metrics.totals.tables / 50, 1) * 15;
  score += tableFactor;
  if (metrics.totals.tables > 30) factors.push(`${metrics.totals.tables} tables`);

  // Factor: Number of fields (0-15 points)
  const fieldFactor = Math.min(metrics.totals.fields / 500, 1) * 15;
  score += fieldFactor;
  if (metrics.totals.fields > 300) factors.push(`${metrics.totals.fields} fields`);

  // Factor: Number of scripts (0-20 points)
  const scriptFactor = Math.min(metrics.totals.scripts / 200, 1) * 20;
  score += scriptFactor;
  if (metrics.totals.scripts > 100) factors.push(`${metrics.totals.scripts} scripts`);

  // Factor: Script complexity (0-15 points)
  const avgSteps = metrics.totals.scripts > 0 ? metrics.totals.scriptSteps / metrics.totals.scripts : 0;
  const stepFactor = Math.min(avgSteps / 50, 1) * 15;
  score += stepFactor;
  if (avgSteps > 30) factors.push(`${Math.round(avgSteps)} avg steps/script`);

  // Factor: Relationships (0-10 points)
  const relFactor = Math.min(metrics.totals.relationships / 100, 1) * 10;
  score += relFactor;
  if (metrics.totals.relationships > 50) factors.push(`${metrics.totals.relationships} relationships`);

  // Factor: TOs (0-10 points)
  const toFactor = Math.min(metrics.totals.tableOccurrences / 100, 1) * 10;
  score += toFactor;
  if (metrics.totals.tableOccurrences > 50) factors.push(`${metrics.totals.tableOccurrences} TOs`);

  // Factor: Calc fields ratio (0-10 points)
  const calcRatio = metrics.totals.fields > 0 ? metrics.totals.calcFields / metrics.totals.fields : 0;
  const calcFactor = Math.min(calcRatio / 0.5, 1) * 10;
  score += calcFactor;
  if (calcRatio > 0.3) factors.push(`${Math.round(calcRatio * 100)}% calc fields`);

  // Factor: Multi-file (0-5 points)
  if (databases.length > 1) {
    score += Math.min(databases.length, 5);
    factors.push(`${databases.length} files`);
  }

  metrics.complexity.score = Math.round(score);
  metrics.complexity.factors = factors;

  if (score < 25) metrics.complexity.level = 'Simple';
  else if (score < 50) metrics.complexity.level = 'Moderate';
  else if (score < 75) metrics.complexity.level = 'Complex';
  else metrics.complexity.level = 'Very Complex';

  return metrics;
}

/**
 * Analyze field usage across databases
 */
function analyzeFieldUsage(databases, reverseRefs) {
  const usage = {
    all: [],           // All fields with usage info
    unused: [],        // Fields with no references
    rarelyUsed: [],    // Used in 1 place
    moderatelyUsed: [], // 2-5 references
    heavilyUsed: [],   // 6+ references
    byTable: {},       // Grouped by table
    summary: {
      total: 0,
      unused: 0,
      calculated: 0,
      global: 0,
      indexed: 0,
      containers: 0,
    },
  };

  for (const db of databases) {
    for (const table of db.tables || []) {
      const tableKey = `${db.name}::${table.name}`;
      usage.byTable[tableKey] = [];

      for (const field of table.fields || []) {
        const fieldKey = `${table.name}::${field.name}`;

        // Collect usage references
        const inScripts = reverseRefs?.fieldInScripts?.[fieldKey] || [];
        const onLayouts = reverseRefs?.fieldOnLayouts?.[fieldKey] || [];
        const inCalcs = reverseRefs?.fieldInCalcs?.[fieldKey] || [];

        const totalRefs = inScripts.length + onLayouts.length + inCalcs.length;

        // Skip common system fields for "unused" categorization
        const systemFields = ['id', 'uuid', 'created', 'modified', 'createdby', 'modifiedby', 'pk', 'fk', 'primarykey', 'foreignkey'];
        const isSystem = systemFields.some(sf => field.name.toLowerCase().includes(sf));

        const fieldInfo = {
          name: field.name,
          fullName: fieldKey,
          table: table.name,
          db: db.name,
          dataType: field.dataType,
          fieldType: field.fieldType,
          isGlobal: field.global || false,
          isIndexed: field.indexed || false,
          isCalculated: field.fieldType === 'Calculated',
          isSummary: field.fieldType === 'Summary',
          hasAutoEnter: !!field.autoEnter,
          hasValidation: !!field.validation,
          isSystem,
          references: {
            scripts: inScripts,
            layouts: onLayouts,
            calcs: inCalcs,
          },
          refCount: totalRefs,
          scriptCount: inScripts.length,
          layoutCount: onLayouts.length,
          calcCount: inCalcs.length,
        };

        usage.all.push(fieldInfo);
        usage.byTable[tableKey].push(fieldInfo);

        // Update summary
        usage.summary.total++;
        if (field.fieldType === 'Calculated') usage.summary.calculated++;
        if (field.global) usage.summary.global++;
        if (field.indexed) usage.summary.indexed++;
        if (field.dataType === 'Container') usage.summary.containers++;

        // Categorize by usage level
        if (totalRefs === 0 && !isSystem) {
          usage.unused.push(fieldInfo);
          usage.summary.unused++;
        } else if (totalRefs === 1) {
          usage.rarelyUsed.push(fieldInfo);
        } else if (totalRefs >= 2 && totalRefs <= 5) {
          usage.moderatelyUsed.push(fieldInfo);
        } else if (totalRefs > 5) {
          usage.heavilyUsed.push(fieldInfo);
        }
      }
    }
  }

  // Sort by table for easier browsing
  usage.unused.sort((a, b) => a.table.localeCompare(b.table) || a.name.localeCompare(b.name));
  usage.rarelyUsed.sort((a, b) => a.table.localeCompare(b.table) || a.name.localeCompare(b.name));
  usage.heavilyUsed.sort((a, b) => b.refCount - a.refCount);

  return usage;
}

/**
 * Analyze performance concerns
 */
function analyzePerformance(databases) {
  const hints = {
    unstoredCalcs: [],
    wideTables: [],        // Tables with many fields
    largeScripts: [],      // Scripts with many steps
    heavyRelationships: [], // TOs with many relationships
    containerFields: [],   // Container fields (potential storage concerns)
    globalFields: [],      // Global fields (session state)
    executeSQLCalcs: [],   // Calcs using ExecuteSQL
    summary: {
      unstoredCalcCount: 0,
      wideTableCount: 0,
      largeScriptCount: 0,
      containerFieldCount: 0,
      globalFieldCount: 0,
    },
  };

  const WIDE_TABLE_THRESHOLD = 50;   // Fields
  const LARGE_SCRIPT_THRESHOLD = 100; // Steps

  for (const db of databases) {
    // Check tables
    for (const table of db.tables || []) {
      // Wide tables
      if (table.fields?.length > WIDE_TABLE_THRESHOLD) {
        hints.wideTables.push({
          name: table.name,
          db: db.name,
          fieldCount: table.fields.length,
          severity: table.fields.length > 100 ? 'high' : 'medium',
        });
        hints.summary.wideTableCount++;
      }

      // Check fields
      for (const field of table.fields || []) {
        // Unstored calculations (fieldType is Calculated but not stored)
        if (field.fieldType === 'Calculated') {
          // Check if calc uses unstored patterns or has storage issues
          const calcText = field.calcText?.toLowerCase() || '';
          const hasExecuteSQL = calcText.includes('executesql');
          const hasGetField = calcText.includes('getfield') || calcText.includes('evaluate');
          const hasRelatedRecords = calcText.includes('list(') || calcText.includes('sum(') || calcText.includes('count(');

          if (hasExecuteSQL) {
            hints.executeSQLCalcs.push({
              field: field.name,
              table: table.name,
              db: db.name,
              calcText: field.calcText?.slice(0, 100) + (field.calcText?.length > 100 ? '...' : ''),
            });
          }

          if (hasGetField || hasRelatedRecords || hasExecuteSQL) {
            hints.unstoredCalcs.push({
              field: field.name,
              table: table.name,
              db: db.name,
              reason: hasExecuteSQL ? 'ExecuteSQL' : hasGetField ? 'Dynamic evaluation' : 'Aggregate function',
              severity: hasExecuteSQL ? 'high' : 'medium',
            });
            hints.summary.unstoredCalcCount++;
          }
        }

        // Container fields
        if (field.dataType === 'Container') {
          hints.containerFields.push({
            field: field.name,
            table: table.name,
            db: db.name,
            isGlobal: field.global || false,
          });
          hints.summary.containerFieldCount++;
        }

        // Global fields
        if (field.global) {
          hints.globalFields.push({
            field: field.name,
            table: table.name,
            db: db.name,
            dataType: field.dataType,
          });
          hints.summary.globalFieldCount++;
        }
      }
    }

    // Large scripts
    for (const script of db.scripts || []) {
      const stepCount = script.steps?.length || script.stepCount || 0;
      if (stepCount > LARGE_SCRIPT_THRESHOLD) {
        hints.largeScripts.push({
          name: script.name,
          db: db.name,
          folder: script.folder,
          stepCount,
          severity: stepCount > 200 ? 'high' : 'medium',
        });
        hints.summary.largeScriptCount++;
      }
    }

    // TOs with many relationships (relationship graph complexity)
    const toRelCounts = {};
    for (const rel of db.relationships || []) {
      toRelCounts[rel.leftTable] = (toRelCounts[rel.leftTable] || 0) + 1;
      toRelCounts[rel.rightTable] = (toRelCounts[rel.rightTable] || 0) + 1;
    }

    for (const [toName, count] of Object.entries(toRelCounts)) {
      if (count > 10) {
        hints.heavyRelationships.push({
          toName,
          db: db.name,
          relationshipCount: count,
          severity: count > 20 ? 'high' : 'medium',
        });
      }
    }
  }

  // Sort by severity
  hints.unstoredCalcs.sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0));
  hints.wideTables.sort((a, b) => b.fieldCount - a.fieldCount);
  hints.largeScripts.sort((a, b) => b.stepCount - a.stepCount);

  return hints;
}

export default parseXMLFiles;
