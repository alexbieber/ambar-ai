import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/expense.dart';

class ExpenseListItem extends StatelessWidget {
  final Expense expense;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const ExpenseListItem({
    super.key,
    required this.expense,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        onTap: onEdit,
        onLongPress: onEdit,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: expense.category.color.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.receipt_long, color: expense.category.color),
        ),
        title: Text(expense.title),
        subtitle: Text(
          '${expense.category.name} • ${DateFormat.yMMMd().format(expense.date)}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              NumberFormat.currency(symbol: '\$', decimalDigits: 2)
                  .format(expense.amount),
              style: Theme.of(context).textTheme.titleMedium!.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(width: 8),
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'edit' && onEdit != null) {
                  onEdit!();
                } else if (value == 'delete' && onDelete != null) {
                  onDelete!();
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Text('Edit'),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Text('Delete'),
                ),
              ],
              icon: const Icon(Icons.more_vert, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}

