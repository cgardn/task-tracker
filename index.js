/*
Bugs:
- bug: adding an item doesn't use the input, or clear it

Todo Features:
- move new list to ghost card w/ dotted border on left if no cards, as smaller skinny ghost card if some cards
- move new item to top of list cards
- fix edit mode for items, add some kind of edit for card titles, will need confirm/cancel buttons which can probably be re-used for delete confirmation
- settings sidebar
  - themes, colors
    + top bar, background, cards, text
    - include some palettes with the palette generator, and the ability to make a new theme/palette (ez js object)
  - export/import to json, including settings
  - add whole state to local storage
- Drag and Drop

Todo styling:
- add a font
- add better colors

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
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    console.log('dragover', e);
  }, { bubbles: true });

  document.getElementById('list-container').addEventListener('drop', (e) => {
    console.log('drop', e);
  });
   */

/* sidebar */
document.querySelector('.sidebar .open-button').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

document.querySelectorAll('.sidebar input[type="color"]').forEach(el => {
  el.addEventListener('change', (e) => {
    document.documentElement.style.setProperty(`--${e.target.name}`, e.target.value);
  });
});


/* app */
class TrackerApp extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.template = document.getElementById('app-template').content;
    this.appendChild(this.template.cloneNode(true));
    this.setupEvents();
  }

  new_list_input_handler(inputElement) {
    let list = document.createElement('tracker-list');
    list.title = inputElement.value;
    inputElement.closest('.app').querySelector('.app-tasks').appendChild(list)
    inputElement.value = '';
  }

  setupEvents() {
    this.querySelector('[data-input]').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.new_list_input_handler(e.target);
      }
    });
    this.querySelector('[data-add]').addEventListener('click', (e) => {
      this.new_list_input_handler(e.target.previousElementSibling)
    });
  }

  export() {
    let exportedData = {}
    this.querySelectorAll('tracker-list').forEach(list => {
      exportedData[list.title] = [];
      list.querySelectorAll('tracker-item').forEach(item => {
        exportedData[list.title].push({ text: item.querySelector('span').innerHTML });
      });
    })
    return JSON.stringify(exportedData);
  }

  import(data) {
    this.querySelector('task-container').innerHTML = '';
    const importedData = JSON.parse(data);
    for (let list in importedData) {
      let newList = document.createElement('tracker-list');
      newList.title = list;
      importedData[list].forEach(item => {
        let newItem = document.createElement('tracker-item');
        newItem.text = item.text;
        newList.appendChild(newItem);
      });
      this.querySelector('task-container').appendChild(newList);
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
    this.setAttribute('draggable', true);
    
    this.getAttribute('title') ? this.querySelector('h2').innerHTML = this.getAttribute('title') : this.querySelector('h2').innerHTML = 'New List';

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
    this.addEventListener('dragstart', (e) => {
      console.log('dragstart', e.target);
    });
    this.addEventListener('dragend', (e) => {
      console.log('dragend', e.target);
    });
  }

  addItem(text) {
    let item = document.createElement('tracker-item');
    item.setAttribute('text', text);
    this.querySelector('.list-items')?.appendChild(item);
  }

  delete() {
    this.remove();
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

    this.querySelector('[data-delete]').addEventListener('click', () => {
      this.delete();
    });
    this.querySelector('span').addEventListener('click', () => {
      this.setEditMode(true);
    });
  }

  setText(text) {
    this.querySelector('span').innerHTML = text;
  }

  setEditMode(mode) {
    this.querySelector('span').style.display = mode ? 'none' : 'block';
    this.querySelector('input').style.display = mode ? 'block' : 'none';
  }

  delete() {
    this.remove();
  }
}

customElements.define('tracker-app', TrackerApp);
customElements.define('tracker-list', TrackerList);
customElements.define('tracker-item', TrackerItem);

