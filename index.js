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
})()

class TrackerList extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.template = document.getElementById('list-template').content;
    this.appendChild(this.template.cloneNode(true));
    
    this.getAttribute('title') ? this.querySelector('h2').innerHTML = this.getAttribute('title') : this.querySelector('h2').innerHTML = 'New List';

    this.querySelector("button[data-delete]").addEventListener('click', () => {
      this.delete();
    });
    this.querySelector("button[data-add]").addEventListener('click', () => {
      this.addItem(this.querySelector('input').value);
      this.querySelector('input').value = '';
    });
    this.querySelector('input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addItem(e.target.value);
        e.target.value = '';
      }
    });
  }

  addItem(text) {
    let item = document.createElement('tracker-item');
    item.setAttribute('text', text);
    console.log(item)
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

    this.querySelector('button').addEventListener('click', () => {
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

