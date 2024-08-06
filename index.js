/*
Bugs:
- bug: adding an item doesn't use the input, or clear it

Todo Features:
- settings sidebar
  - themes, colors
  - export/import to json
- Drag and Drop

Todo styling:
- add a font
- add better colors

*/

(function() {
  /* app */
  function new_list_input_handler(inputElement) {
    let list = document.createElement('tracker-list');
    list.title = inputElement.value;
    inputElement.closest('.app').querySelector('.app-tasks').appendChild(list)
    inputElement.value = '';
  }
  document.getElementById('new-list-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      new_list_input_handler(e.target);
    }
  });
  document.getElementById('new-list-button').addEventListener('click', (e) => {
    new_list_input_handler(e.target.previousElementSibling)
  });

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
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    console.log('dragover', e);
  }, { bubbles: true });

  document.getElementById('list-container').addEventListener('drop', (e) => {
    console.log('drop', e);
  });
})()

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

customElements.define('tracker-list', TrackerList);
customElements.define('tracker-item', TrackerItem);

