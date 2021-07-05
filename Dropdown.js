var dropdown = (function () { // for encapsulation

    var dropdownObj = function (id, data, textField, valueField, options) {

        this.id = id;
        this.element = document.getElementById(this.id);
        this.open = false;
        this.originalData = data;
        this.textField = textField;
        this.valueField = valueField;
        this.selectedItem = null;
        this.value = null;
        this.toggle = null;
        this.menu = null;
        this.itemsList = null;
        this.sb = null;

        this.eventListners = {
            'change': [],
        };

        this.options = {
            hasSearch: (options && options.hasSearch) || false,
            hasTreeStructure: (options && options.hasTreeStructure) || false,
            hasMultipleSelection: (options && options.hasMultipleSelection) || false,
            hasCollapse: (options && options.hasTreeStructure && options.hasCollapse) || false,
        }

        if (this.options.hasMultipleSelection) {
            this.selectedValues = [];
        }

        this.addEventListener = function (event, handler) {
            this.eventListners[event] && this.eventListners[event].push(handler);
        };

        this.dispatch = function (event, data) {
            var listeners = this.eventListners[event];
            var length = listeners.length;

            for (var i = 0; i < length; i++) {
                listeners[i](data);
            }
        };

        this.draw = function () {
            this.toggle = createToggle(this, 'اختر من القائمة', toggleHandle);
            this.menu = createDdlMenu(this, this.originalData, this.textField, this.valueField);

            this.element.classList.add('dropdown');
            this.element.innerHTML = '';
            this.element.append(
                this.toggle,
                this.menu
            );
            window.addEventListener('click', this.outsideClickHandle.bind(this))
        };

        this.closeMenu = function () {
            this.open = false;
            this.menu.style.display = 'none';
        };

        this.openMenu = function () {
            this.open = true;
            this.menu.style.display = 'block';
            this.scrollToSelected();
        };

        this.outsideClickHandle = function (e) {
            if (this.open && e.target != this.element && !isAncestorOf(this.element, e.target)) {
                this.toggle.click();
                e.target.click();
            }
        };

        this.setSelectedValue = function (val) {
            setDropdownValue(this, getItemByValue(this.id, val));
        };

        this.setSelectedValues = function (values) {
            setDropdownValues(this, values);
        };

        this.getSelectedValue = function () {
            return this.value;
        };

        this.getSelectedValues = function () {
            return this.selectedValues;
        };

        this.updateList = function (text) {
            var newItems;
            if (this.options && !this.options.hasTreeStructure) {
                newItems = searchNoTree(this, text);
                this.rerenderItemsNoTree(newItems);
            } else if (this.options && this.options.hasTreeStructure) {
                newItems = searchTree(this, text);
                this.rerenderItemsTree(newItems);
            }

            if (!(this.options && this.options.hasMultipleSelection)) {
                this.setSelectedValue(this.value);
            } else {
                this.setSelectedValues(this.selectedValues);
            }

            this.scrollToSelected();
        };

        this.rerenderItemsNoTree = function (items) {
            var itemsList = createItemsList(this, items, this.textField, this.valueField);
            fillItemsDiv(this.itemsList, itemsList);
        };

        this.rerenderItemsTree = function (items) {
            var itemsList = createHierarchyList(this, items);
            fillItemsDiv(this.itemsList, itemsList);
        };

        this.scrollToSelected = function () {
            if (this.options && this.options.hasMultipleSelection) {
                if (this.selectedValues[0]) {
                    var item = getFirstSelectedItem(this);
                    if (item) {
                        this.itemsList.scrollTop = item.offsetTop;
                    }
                } else {
                    this.itemsList.scrollTop = 0;
                }
            } else {
                if (this.selectedItem) {
                    var itemTop = this.selectedItem.offsetTop;
                    this.itemsList.scrollTop = itemTop;
                } else {
                    this.itemsList.scrollTop = 0;
                }
            }
        }
    };

    var getFirstSelectedItem = function (ddl) {
        var items = getAllItems(ddl.id);
        var length = items.length;

        for (var i = 0; i < length; i++) {
            if (ddl.selectedValues.indexOf(items[i].data) !== -1)
                return items[i];
        }

        return null;
    }

    var setDropdownValues = function (ddl, values) {
        if (values) {
            var length = values.length;

            for (var i = 0; i < length; i++) {
                if (ddl.selectedValues.indexOf(values[i]) === -1) {
                    ddl.selectedValues.push(values[i]);
                    var item = getItemByValue(ddl.id, values[i]);
                    item.setAsChecked();
                }
            }
        }
    }

    var plainItemClickHandle = function (ddl, e) {
        setDropdownValue(ddl, e.currentTarget);
        ddl.toggle.click();
    };

    var checkItemClickHandle = function (ddl, e) {
        addRemoveDropdownValue(ddl, e.currentTarget);
    };

    var toggleHandle = function (ddl, e) {
        toggleDropdown(ddl);
    };

    var searchNoTree = function (ddl, text) {
        var result = ddl.originalData.filter(function (d, i) {
            return d[ddl.textField].indexOf(text) !== -1;
        });

        return result;
    }

    var searchTree = function (ddl, text) {
        var result = ddl.originalData.map(function (d) {
            return {
                parent: d.parent,
                data: d.data.filter(function (l) {
                    return l[ddl.textField].indexOf(text) !== -1;
                })
            }
        });

        return result;
    }

    var createDropdown = function (id, data, textField, valueField, options) {
        var ddl = new dropdownObj(id, data, textField, valueField, options);
        ddl.draw();

        interfaceObj = {
            id: ddl.id,
            addEventListener: ddl.addEventListener.bind(ddl),
        };

        if (options && options.hasMultipleSelection) {
            interfaceObj.setVals = ddl.setSelectedValues.bind(ddl);
            interfaceObj.getVals = ddl.getSelectedValues.bind(ddl);
        } else {
            interfaceObj.setVal = ddl.setSelectedValue.bind(ddl);
            interfaceObj.getVal = ddl.getSelectedValue.bind(ddl);
        }

        return interfaceObj;
    }

    var setDropdownValue = function (ddl, item) {
        if (item && ddl.selectedItem !== item) {
            ddl.selectedItem && ddl.selectedItem.classList.remove('selected');
            ddl.value = item.data;
            ddl.selectedItem = item;
            ddl.selectedItem.classList.add('selected');
            ddl.toggle.setText(item.innerText);
            ddl.dispatch('change', ddl);
        }
    }

    var addRemoveDropdownValue = function (ddl, item) {
        if (item) {
            if (ddl.selectedValues.indexOf(item.data) === -1) {
                ddl.selectedValues.push(item.data);
                item.classList.add('selected');
            } else {
                ddl.selectedValues.splice(ddl.selectedValues.indexOf(item.data), 1);
                item.classList.remove('selected');
            }
            ddl.dispatch('change', ddl);
        }
    }

    var getItemByValue = function (dropdownId, value) {
        var items = getAllItems(dropdownId);
        var length = items.length;

        for (var i = 0; i < length; i++) {
            if (items[i].data === value)
                return items[i];
        }

        return null;
    }

    var isAncestorOf = function (parent, child) {
        if (parent === child) {
            return false;
        }

        while (child = child.parentNode) {
            if (child === parent) {
                return true;
            }
        }

        return false;
    }

    var createToggleArrow = function (toggleId) {
        var toggleArrow = document.createElement('span');
        toggleArrow.innerText = '<';
        toggleArrow.classList.add('toggle-arrow');
        toggleArrow.id = toggleId + '-arrow';
        return toggleArrow;
    }

    var createToggleText = function (text, toggleId) {
        var toggleText = document.createElement('span');
        toggleText.innerText = text;
        toggleText.classList.add('toggle-text');
        toggleText.id = toggleId + '-text';
        return toggleText;
    }

    var createTogglediv = function (dropdownId) {
        var toggle = document.createElement('div');
        toggle.classList.add('dropdown-toggle');
        toggle.id = dropdownId + '-toggle';
        return toggle;
    }

    var createToggle = function (ddl, text, onToggle) {
        var toggle = createTogglediv(ddl.id);

        var toggleText = createToggleText(text, toggle.id);

        var toggleArrow = createToggleArrow(toggle.id);

        toggle.append(toggleText, toggleArrow);
        toggle.addEventListener('click', function (e) {
            onToggle(ddl, e);
        });

        toggle.reverseArrow = function () {
            toggleArrow.innerText = toggleArrow.innerText === '>' ? '<' : '>';
        }

        toggle.setText = function (text) {
            toggleText.innerText = text;
        }

        return toggle;
    }

    var createPlainItem = function (itemId, ddl, text, value, itemClickHandle) {
        var item = document.createElement('div');
        item.id = itemId;
        item.classList.add('item');
        item.innerText = text;
        item.data = value;
        item.addEventListener('click', function (e) {
            itemClickHandle(ddl, e);
        });
        return item;
    }

    var createCheckbox = function () {
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('dropdown-checkbox');
        return checkbox;
    }

    var createSpan = function (id, classes, text) {
        var span = document.createElement('span');

        if (id) {
            span.id = id;
        }

        if (classes) {
            if (classes.constructor.name === 'Array') {
                var length = classes.length;

                for (var i = 0; i < length; i++) {
                    span.classList.add(classes[i]);
                }
            } else {
                span.classList.add(classes);
            }
        }

        if (text) {
            span.innerText = text;
        }

        return span;
    }

    var createCheckboxItem = function (itemId, ddl, text, value, itemClickHandle) {
        var checkbox = createCheckbox();

        var span = createSpan(null, 'dropdown-item-txt', text);

        var item = document.createElement('div');
        item.id = itemId;
        item.classList.add('item');
        item.data = value;

        item.append(span);
        item.append(checkbox);

        item.setAsChecked = function () {
            checkbox.checked = 'checked';
            item.classList.add('selected');
        };

        item.unCheck = function () {
            checkbox.checked = false;
            item.classList.remove('selected');
        };

        item.addEventListener('click', function (e) {
            itemClickHandle(ddl, e);
            if (e.target != checkbox) {
                checkbox.checked = !checkbox.checked;
            }
        });

        if (ddl.selectedValues.indexOf(value) !== -1) {
            item.classList.add('selected');
            checkbox.checked = 'checked';
        }

        return item;
    }

    var createItemsListDiv = function (ddl) {
        var menu = document.createElement('div');
        menu.id = ddl.id + '-items';
        menu.classList.add('items');

        ddl.itemsList = menu;
        return menu;
    }

    var createDropdownItem = function (itemId, ddl, text, value) {
        if (ddl.options && ddl.options.hasMultipleSelection) {
            return createCheckboxItem(itemId, ddl, text, value, checkItemClickHandle);
        } else {
            return createPlainItem(itemId, ddl, text, value, plainItemClickHandle);
        }
    }

    var createItemsList = function (ddl, data, textField, valueField, parentIndex) {
        var list = [];

        var count = data.length;
        for (var i = 0; i < count; i++) {
            var item = createDropdownItem(ddl.id + '-item-' + (parentIndex !== undefined || '') + i, ddl, data[i][textField], data[i][valueField]);

            if (parentIndex !== undefined) {
                item.classList.add('child');
            }

            list.push(item);
        }

        return list;
    }

    var fillItemsDiv = function (div, itemsList) {
        var length = itemsList.length;
        div.innerHTML = '';
        for (var i = 0; i < length; i++) {
            div.append(itemsList[i]);
        }
    }

    var createDdlMenu = function (ddl, data, textField, valueField) {
        var itemsList;

        if (ddl.options.hasTreeStructure) {
            itemsList = createHierarchyList(ddl, data);
        } else {
            itemsList = createItemsList(ddl, data, textField, valueField);
        }

        if (!(ddl.options && ddl.options.hasMultipleSelection)) {
            itemsList.unshift(createDropdownItem(ddl.id + '-item-' + '-1', ddl, 'اختر من القائمة', null));
        }

        var itemsListDiv = createItemsListDiv(ddl);
        fillItemsDiv(itemsListDiv, itemsList);

        var menu = document.createElement('div');
        menu.id = ddl.id + '-menu';
        menu.classList.add('menu');

        if (ddl.options && ddl.options.hasSearch) {
            menu.append(createSearchBox(ddl));
        }

        if (ddl.options && ddl.options.hasMultipleSelection) {
            menu.append(createSelectClearDiv(ddl));
        }

        menu.append(itemsListDiv);

        return menu;
    }

    var createSearchBox = function (ddl) {
        var sb = document.createElement('input');
        sb.id = ddl.id + '-sb'; // search box (sb)
        sb.type = 'text';
        sb.placeholder = 'بحث';
        sb.classList.add('dropdown-search');
        ddl.sb = sb;
        sb.addEventListener('keyup', function (e) {
            ddl.updateList(e.target.value);
        });
        return sb;
    }

    var toggleDropdown = function (dd) {
        if (dd.open) {
            dd.closeMenu();
        } else {
            dd.openMenu();
        }
        dd.toggle.reverseArrow();
    }

    var getAllItems = function (dropdownId) {
        return document.querySelectorAll('[id^="' + dropdownId + '-item-"]');
    }

    var createSelectClearDiv = function (ddl) {
        var div = document.createElement('div');
        div.id = ddl.id + '-select-clear';
        div.classList.add('select-clear');

        div.append(createSelectAll(ddl), createClearAll(ddl));

        return div;
    }

    var createButton = function (id, type, classes, text) {
        var button = document.createElement('button');

        if (id) {
            button.id = id;
        }

        if (type) {
            button.type = type;
        }

        if (classes) {
            if (classes.constructor.name === 'Array') {
                var length = classes.length;

                for (var i = 0; i < length; i++) {
                    button.classList.add(classes[i]);
                }
            } else {
                button.classList.add(classes);
            }
        }

        if (text) {
            button.innerText = text;
        }

        return button;
    }

    var createSelectAll = function (ddl) {
        var btnAll = createButton(ddl.id + '-selectAll', 'button', null, 'اختيار الكل');

        btnAll.onclick = function (e) {
            var items = getAllItems(ddl.id);
            var length = items.length;
            var changed = false;

            for (var i = 0; i < length; i++) {
                if (ddl.selectedValues.indexOf(items[i].data) === -1) {
                    ddl.selectedValues.push(items[i].data);
                    items[i].setAsChecked();
                    if (!changed) {
                        changed = true;
                    }
                }
            }

            if (changed) {
                ddl.dispatch('change', ddl);
            }
        }
        return btnAll;
    }

    var createClearAll = function (ddl) {
        var clearAll = createButton(ddl.id + '-clearAll', 'button', null, 'الغاء الاختيار');

        clearAll.onclick = function (e) {
            if (ddl.selectedValues.length > 0) {
                ddl.selectedValues = [];
                var items = getAllItems(ddl.id);
                var length = items.length;
                var changed = false;

                for (var i = 0; i < length; i++) {
                    items[i].unCheck();
                }
                if (!changed) {
                    changed = true;
                }
            }

            if (changed) {
                ddl.dispatch('change', ddl);
            }
        }

        return clearAll;
    }

    var addCollapseButton = function (parentItem) {
        var collapseButton = createButton(parentItem.id + '-collapse', 'button', 'btn-collapse', '-');
            collapseButton.addEventListener('click', function (e) {
                if (!parentItem.isCollapsed) {
                    parentItem.childrenDiv.style.display = 'none';
                    collapseButton.innerText = '+';
                    parentItem.isCollapsed = true;
                } else {
                    parentItem.childrenDiv.style.display = 'block';
                    collapseButton.innerText = '-';
                    parentItem.isCollapsed = false;
                }
            });
            parentItem.prepend(collapseButton);
    }

    var createParentItem = function (ddl, parent, index) {
        var parentItem = document.createElement('div');
        parentItem.id = ddl.id + '-parent-' + index;
        parentItem.classList.add('item', 'parent');

        var span = createSpan(null, 'dropdown-item-txt', parent);

        parentItem.append(span);

        return parentItem;
    }

    var createParentItemWithcheckbox = function (ddl, parent, children, index) {
        var checkbox = createCheckbox();

        var span = createSpan(null, 'dropdown-item-txt', parent);

        var item = document.createElement('div');
        item.id = ddl.id + '-parent-' + index;
        item.classList.add('item');

        item.append(span, checkbox);

        item.setAsChecked = function () {
            checkbox.checked = 'checked';
            item.classList.add('selected');
        };

        item.unCheck = function () {
            checkbox.checked = false;
            item.classList.remove('selected');
        };

        item.addEventListener('click', function (e) {
            if (e.target.type === 'button') {
                e.preventDefault();
                return;
            }

            if (areAllChildrenChecked(ddl, children)) {
                children.forEach(child => {
                    if (ddl.selectedValues.indexOf(child.data) !== -1) {
                        child.click();
                    }
                });
            } else {
                children.forEach(child => {
                    if (ddl.selectedValues.indexOf(child.data) === -1) {
                        child.click();
                    }
                });
            }
        });

        if (areAllChildrenChecked(ddl, children)) {
            item.setAsChecked();
        } else {
            item.unCheck();
        }

        ddl.addEventListener('change', function (e) {
            if (areAllChildrenChecked(ddl, children)) {
                item.setAsChecked();
            } else {
                item.unCheck();
            }
        });

        return item;
    }

    var areAllChildrenChecked = function (ddl, children) {
        if (children.length === 0) {
            return false;
        }
        var unCheckedCount = children.filter(child => {
            return ddl.selectedValues.indexOf(child.data) === -1;
        }).length;

        return unCheckedCount === 0;
    }

    var createHierarchy = function (ddl, parent, children, index) {
        var childrenItems = createItemsList(ddl, children, ddl.textField, ddl.valueField, index);
        var childrenDiv = document.createElement('div');

        var parentItem;

        if (ddl.options.hasMultipleSelection) {
            parentItem = createParentItemWithcheckbox(ddl, parent, childrenItems, index);
        } else {
            parentItem = createParentItem(ddl, parent, index);
        }

        fillItemsDiv(childrenDiv, childrenItems);

        if (ddl.options.hasCollapse) {
            parentItem.childrenDiv = childrenDiv;
            addCollapseButton(parentItem);
        }

        var hierarchy = document.createElement('div');

        hierarchy.append(parentItem, childrenDiv);

        return hierarchy;
    }

    var createHierarchyList = function (ddl, data) {
        var hierarchyList = [];


        var length = data.length;

        for (var i = 0; i < length; i++) {
            hierarchyList.push(
                createHierarchy(ddl, data[i].parent, data[i].data, i)
            );
        }

        return hierarchyList;
    }

    return {
        createDropdown
    };
}());


var plainData = [
    { text: 'مصر', value: 1, },
    { text: 'الولايات المتحدة', value: 7, },
    { text: 'المملكة العربية السعودية', value: 5, },
    { text: 'الامارات العربية', value: 3, },
    { text: 'المملكة المتحدة', value: 10, },
    { text: 'فرنسا', value: 12, },
    { text: 'المانيا', value: 17, },
    { text: 'استراليا', value: 15, },
    { text: 'قطر', value: 13, },
    { text: 'الكويت', value: 30, },
]

var treeData = [
    {
        parent: 'مصر',
        data: [
            { text: 'القاهرة', value: 1 },
            { text: 'الاسكندرية', value: 2 },
            { text: 'الجيزة', value: 3 },
            { text: 'السويس', value: 4 },
            { text: 'المنصورة', value: 50 },
            { text: 'بور سعيد', value: 60},
        ],
    },

    {
        parent: 'المملكة العربية السعودية',
        data: [
            { text: 'مكة', value: 5 },
            { text: 'المدينة', value: 6 },
            { text: 'الرياض', value: 7 },
            { text: 'جدة', value: 8 },
            { text: 'أبهى', value: 9 },
        ],
    },

    {
        parent: 'الامارات',
        data: [
            { text: 'دبى', value: 10 },
            { text: 'ابو ظبي', value: 11 },
            { text: 'الشارقة', value: 12 },
        ],
    },
]

window.addEventListener('load', function () {
    var plain = dropdown.createDropdown('plain', plainData, 'text', 'value');

    plain.addEventListener('change', function (d) {
        document.getElementById('plain-value').innerText = JSON.stringify(plain.getVal());
    });

    var plainSearch = dropdown.createDropdown('plain-search', plainData, 'text', 'value', {
        hasSearch: true,
    });

    plainSearch.addEventListener('change', function (d) {
        document.getElementById('plain-search-value').innerText = JSON.stringify(plainSearch.getVal());
    });

    var plainMulti = dropdown.createDropdown('plain-multi', plainData, 'text', 'value', {
        hasMultipleSelection: true,
    });

    plainMulti.addEventListener('change', function (d) {
        document.getElementById('plain-multi-value').innerText = JSON.stringify(plainMulti.getVals());
    });

    var plainSearchMulti = dropdown.createDropdown('plain-search-multi', plainData, 'text', 'value', {
        hasMultipleSelection: true,
        hasSearch: true,
    });

    plainSearchMulti.addEventListener('change', function (d) {
        document.getElementById('plain-search-multi-value').innerText = JSON.stringify(plainSearchMulti.getVals());
    });

    var tree = dropdown.createDropdown('tree', treeData, 'text', 'value', {
        hasTreeStructure: true,
    });

    tree.addEventListener('change', function (d) {
        document.getElementById('tree-value').innerText = JSON.stringify(tree.getVal());
    });

    var treeCollapse = dropdown.createDropdown('tree-collapse', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasCollapse: true,
    });

    treeCollapse.addEventListener('change', function (d) {
        document.getElementById('tree-collapse-value').innerText = JSON.stringify(treeCollapse.getVal());
    });

    var treeSearch = dropdown.createDropdown('tree-search', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasSearch: true,
    });

    treeSearch.addEventListener('change', function (d) {
        document.getElementById('tree-search-value').innerText = JSON.stringify(treeSearch.getVal());
    });

    var treeSearchCollapse = dropdown.createDropdown('tree-search-collapse', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasCollapse: true,
        hasSearch: true,
    });

    treeSearchCollapse.addEventListener('change', function (d) {
        document.getElementById('tree-search-collapse-value').innerText = JSON.stringify(treeSearchCollapse.getVal());
    });

    var treeMulti = dropdown.createDropdown('tree-multi', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasMultipleSelection: true,
    });

    treeMulti.addEventListener('change', function (d) {
        document.getElementById('tree-multi-value').innerText = JSON.stringify(treeMulti.getVals());
    });

    var treeMultiCollapse = dropdown.createDropdown('tree-multi-collapse', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasMultipleSelection: true,
        hasCollapse: true,
    });

    treeMultiCollapse.addEventListener('change', function (d) {
        document.getElementById('tree-multi-collapse-value').innerText = JSON.stringify(treeMultiCollapse.getVals());
    });

    var treeSearchMulti = dropdown.createDropdown('tree-search-multi', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasMultipleSelection: true,
        hasSearch: true,
    });

    treeSearchMulti.addEventListener('change', function (d) {
        document.getElementById('tree-search-multi-value').innerText = JSON.stringify(treeSearchMulti.getVals());
    });

    var treeSearchMultiCollapse = dropdown.createDropdown('tree-search-multi-collapse', treeData, 'text', 'value', {
        hasTreeStructure: true,
        hasMultipleSelection: true,
        hasSearch: true,
        hasCollapse: true,
    });

    treeSearchMultiCollapse.addEventListener('change', function (d) {
        document.getElementById('tree-search-multi-collapse-value').innerText = JSON.stringify(treeSearchMultiCollapse.getVals());
    });

});


