/*
Bugs:
- sidebar shouldn't open when clicking outside it

Todo Features:
- Drag and Drop

Todo Refactor:
- app component calls list functions, meaning list must be defined before app, don't like that, but want to keep separation of concerns
  - FIX: maybe move import/export functions outside the components?
- color palette selection should remember whatever the last custom setup was
- the palettes themselves aren't great
- probably should make the sidebar toggle touch target bigger on mobile
- palette select options should be driven by what palettes are actually available so I don't have to type them out twice
*/

  /* app */

  // Drag and Drop
  /*
   * List Concept: listen for dragover and drop on document, but only consider the left/right halves of existing lists to determine where to drop the new list.
   * - can probably only start dragging from list title, this way the items can just drag from themselves
   * - dragover: preventDefault to allow drop event to fire
   * - dragover: get midpoint of all lists, compare to event.clientX to determine where ghost list should be inserted, and save the index of the list to insert before
   * - drop: get nextElementSibling of ghost list, insert new list before it, if it exists, otherwise append to parent
   * 
   * Item Concept: listen for dragover on lists, but only consider the top/bottom halves of existing items to determine where to drop the new item.
   * - dragover: same as list, but compare to event.clientY and look at items inside the list
   * - the rest is pretty much the same
   * 
   * Item list-to-list: use dragenter and dragleave to update which list the item is looking at
   * - for both intra and inter list dragging, if the drop is invalid just cancel the move
   * 
   * For all drag operations, set original item/list to display: none to hide it, if cancelling then just set it back to display: flex
   */

/* sidebar, just some setting and modal control */
document.querySelector('.sidebar .open-button').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});
document.querySelectorAll('.sidebar input[type="color"]').forEach(el => {
  el.addEventListener('change', (e) => {
    document.documentElement.style.setProperty(`--${e.target.name}`, e.target.value);
    document.querySelector('tracker-app').localSave();
  });
});
document.querySelector('.sidebar [data-palette-select]').addEventListener('change', (e) => {
  if (e.target.value === 'custom') return;
  const colors = {
    'light': {
      'top-bar-background-color': '#f0f0f0',
      'background-color': '#f5f5f5',
      'list-background-color': '#ffffff',
      'text-color': '#000000'
    },
    'dark': {
      'top-bar-background-color': '#1a1a1a',
      'background-color': '#333333',
      'list-background-color': '#444444',
      'text-color': '#ffffff'
    },
    'neutral': {
      'top-bar-background-color': '#F0F5EF',
      'background-color': '#D2D2C8',
      'list-background-color': '#E0E2D7',
      'text-color': '#B6B7B2'
    },
    'spring': {
      'top-bar-background-color': '#CED5DF',
      'background-color': '#CDD5C6',
      'list-background-color': '#D9D0C7',
      'text-color': '#59554D'
    },
    'ice': {
      'top-bar-background-color': '#798C8C',
      'background-color': '#AEBFBE',
      'list-background-color': '#F2EFDF',
      'text-color': '#59554C'
    },
    'sunrise': {
      'top-bar-background-color': '#F2958D',
      'background-color': '#F2B29B',
      'list-background-color': '#F2C094',
      'text-color': '#252526'
    }
  }
  for (let color in colors[e.target.value]) {
    document.documentElement.style.setProperty(`--${color}`, colors[e.target.value][color]);
    document.querySelectorAll(`input[name="${color}"]`).forEach(el => {
      el.value = colors[e.target.value][color];
    });
  }
  document.querySelector('tracker-app').localSave();
});
document.querySelector('.sidebar [data-export]').addEventListener('click', () => {
  const modal = document.querySelector("import-export");
  modal.export();
});
document.querySelector('.sidebar [data-import]').addEventListener('click', () => {
  const modal = document.querySelector("import-export");
  modal.openModal('Import');
});
// closing the sidebar when clicking outside of it
document.addEventListener('click', (e) => {
  if (e.target.closest('.sidebar') === null && e.target.closest('.open-button') === null) {
    document.querySelector('.sidebar').classList.remove('open');
  }
});

/* import/export widget, component because re-used for both */
class ImportExport extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.template = document.getElementById('import-export-template').content;
    this.appendChild(this.template.cloneNode(true));

    this.modal = this.querySelector("[data-import-export-modal]");
    this.content = this.querySelector('[data-content]');
    this.importButton = this.querySelector('[data-import]');
    this.closeButton = this.querySelector('[data-close]')

    this.setupEvents();
  }

  setupEvents() {
    this.querySelector('[data-import]').addEventListener('click', () => {
      this.import();
      this.closeModal();
    });
    this.querySelector("[data-import-export-modal] [data-close]").addEventListener('click', () => {
      document.querySelector("[data-import-export-modal]").classList.remove('open');
    });
  }

  export() {
    const data = document.querySelector('tracker-app').export();
    this.content.value = data;
    this.openModal('Export');
  }

  import() {
    document.querySelector('tracker-app').import(this.content.value);
  }

  openModal(state) {
    const title = this.querySelector('[data-title]');
    title.innerHTML = state;
    this.modal.dataset['state'] = state;
    this.modal.classList.add('open');
    if (state === 'Import') {
      this.content.value = '';
    }
  }
  closeModal() {
    this.modal.classList.remove('open');
  }
}

/* app */
class TrackerApp extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.template = document.getElementById('app-template').content;
    this.appendChild(this.template.cloneNode(true));
    this.setupEvents();
    this.localLoad();
  }

  new_list_input_handler(inputElement) {
    this.addList(inputElement.value);
    inputElement.value = '';
  }

  setupEvents() {
    this.querySelector('[data-input]').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.new_list_input_handler(e.target);
        this.localSave();
      }
    });
    this.querySelector('[data-add]').addEventListener('click', (e) => {
      this.new_list_input_handler(e.target.previousElementSibling)
      this.localSave();
    });
  }

  addList(title, items = []) {
    let list = document.createElement('tracker-list');
    list.title = title;
    this.querySelector('.app-tasks').appendChild(list);
    if (items.length) {
      list.import(items);
    }
  }

  clearLists() {
    this.querySelectorAll('tracker-list').forEach(list => {
      list.remove();
    });
  }

  export() {
    let exportedData = {lists: [], settings: {}}
    this.querySelectorAll('tracker-list').forEach(list => {
      exportedData.lists.push({ title: list.getTitle(), items: list.export() });
    })
    exportedData.settings = this.getColorSettings();
    return JSON.stringify(exportedData);
  }

  import(data) {
    this.clearLists();
    const importedData = JSON.parse(data);
    for (let list in importedData.lists) {
      this.addList(importedData.lists[list].title, importedData.lists[list].items);
    };
    this.loadSettings(importedData.settings);
    this.localSave();
  }

  localSave() {
    localStorage.setItem('tracker-app', this.export());
  }
  localLoad() {
    if (localStorage.getItem('tracker-app')) {
      this.import(localStorage.getItem('tracker-app'));
    }
  }

  getColorSettings() {
    return {
      'top-bar-background-color': document.documentElement.style.getPropertyValue('--top-bar-background-color'),
      'background-color': document.documentElement.style.getPropertyValue('--background-color'),
      'list-background-color': document.documentElement.style.getPropertyValue('--list-background-color'),
      'text-color': document.documentElement.style.getPropertyValue('--text-color'),
    }
  }
  loadSettings(settings) {
    for (let setting in settings) {
      document.documentElement.style.setProperty(`--${setting}`, settings[setting]);
      document.querySelectorAll(`input[name="${setting}"]`).forEach(el => {
        el.value = settings[setting];
      });
    }
  }
}

class TrackerList extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.template = document.getElementById('list-template').content;
    this.appendChild(this.template.cloneNode(true));
    
    const title = this.getAttribute('title');
    const titleEl = this.querySelector('h2');
    titleEl.innerHTML = title ? title : 'New List';

    this.setupEvents();
  }

  setupEvents() {
    this.querySelector("[data-delete]").addEventListener('click', () => {
      this.delete();
    });
    this.querySelector("button[data-add]").addEventListener('click', () => {
      const input = this.querySelector('[data-item-input]');
      this.addItem(input.value);
      input.value = '';
    });
    this.querySelector('input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addItem(e.target.value);
        e.target.value = '';
      }
    });
  }

  import(data) {
    for (let item of data) {
      this.addItem(item.text, item.checked);
    }
    this.closest('tracker-app').localSave();
  }

  export() {
    let exportedData = [];
    this.querySelectorAll('tracker-item').forEach(item => {
      exportedData.push({ text: item.querySelector('span').innerHTML, checked: item.querySelector('input').checked });
    });
    return exportedData;
  }

  getTitle() {
    return this.querySelector('h2').innerHTML;
  }

  addItem(text, checked = false) {
    let item = document.createElement('tracker-item');
    item.setAttribute('text', text);
    item.setAttribute('checked', checked);
    this.querySelector('.list-items').appendChild(item);
  }

  delete() {
    this.remove();
    document.querySelector('tracker-app').localSave();
  }
}

class TrackerItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.template = document.getElementById('item-template').content;
    this.appendChild(this.template.cloneNode(true));

    this.setText(this.getAttribute('text') || 'New Task');
    this.setChecked(this.getAttribute('checked') === 'true' ? true : false);

    this.querySelector('[data-delete]').addEventListener('click', () => {
      this.delete();
    });
    this.querySelector('span').addEventListener('click', () => {
      this.setEditMode(true);
    });
    this.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      document.querySelector('tracker-app').localSave();
    });
    this.querySelector('input[type="text"]').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.setText(e.target.value);
        this.setEditMode(false);
        document.querySelector('tracker-app').localSave();
      }
    });
    this.querySelector('input[type="text"]').addEventListener('focusout', (e) => {
      this.setText(e.target.value);
      this.setEditMode(false);
      document.querySelector('tracker-app').localSave();
    });
  }

  setText(text) {
    this.querySelector('span').innerHTML = text;
  }

  setChecked(state) {
    this.querySelector('input').checked = state;
  }

  setEditMode(mode) {
    const editBox = this.querySelector('input[type="text"]');
    this.querySelector('span').style.display = mode ? 'none' : 'block';
    editBox.style.display = mode ? 'block' : 'none';
    editBox.focus();
  }

  delete() {
    this.remove();
    document.querySelector('tracker-app').localSave();
  }
}

customElements.define('tracker-item', TrackerItem);
customElements.define('tracker-list', TrackerList);
customElements.define('tracker-app', TrackerApp);
customElements.define('import-export', ImportExport)