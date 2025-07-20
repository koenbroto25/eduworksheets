import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Question } from '../../types';

interface SequencingProps {
  question: Question;
}

const Sequencing: React.FC<SequencingProps> = ({ question }) => {
  const [items, setItems] = useState(question.items || []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div>
        <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
        <Droppable droppableId="items">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable key={item} draggableId={item} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="border p-2 my-1 bg-white"
                    >
                      {item}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

export default Sequencing;
