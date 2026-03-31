import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'dart:math';

part 'category.g.dart';

String generateUuid() {
  final Random random = Random();
  return List.generate(
    16,
    (i) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
  ).join();
}

@HiveType(typeId: 0)
class Category extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  String name;
  @HiveField(2)
  int colorValue;

  Category({
    required this.id,
    required this.name,
    required this.colorValue,
  });

  Color get color => Color(colorValue);

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        colorValue: json['colorValue'] as int,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'colorValue': colorValue,
      };
}
