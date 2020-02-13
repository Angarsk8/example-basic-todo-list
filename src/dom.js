export function createElement(name, attributes = {}, children = null) {
  const $node = document.createElement(name);

  Object.entries(attributes).forEach(([key, value]) => {
    if (typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase(); // 'onClick' => 'click'
      $node.addEventListener(eventName, value);
    } else {
      $node.setAttribute(key.toString(), value.toString());
    }
  });

  if (Array.isArray(children)) {
    children.forEach($child => {
      $node.appendChild(
        typeof $child === 'string'
          ? document.createTextNode($child)
          : $child
      );
    });
  }

  if (typeof children === 'string') {
    $node.textContent = children;
  }

  return $node;
}
